"""Code runner — generate code + Docker files, run via docker compose, stream logs."""

import asyncio
import os
import shutil
import socket
from pathlib import Path
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.api.dependencies import get_repository, get_flow_to_ir_service, get_function_repository
from app.adapters.generators.docker.docker_generator import generate_docker_files
from app.adapters.generators.php_symfony.generator import SymfonyGenerator
from app.adapters.generators.ts_fastify.generator import FastifyGenerator
from app.adapters.generators.python_fastapi.generator import FastAPIGenerator
from app.adapters.generators.ts_nestjs.generator import NestJSGenerator
from app.adapters.generators.go_gin.generator import GoGinGenerator
from app.adapters.generators.java_spring.generator import SpringBootGenerator
from app.domain.services.flow_to_ir import FlowToIRService
from app.ports.interfaces import FunctionRepositoryPort, ProjectRepositoryPort

router = APIRouter()

GENERATORS = [
    SymfonyGenerator(),
    FastifyGenerator(),
    FastAPIGenerator(),
    NestJSGenerator(),
    GoGinGenerator(),
    SpringBootGenerator(),
]
GENERATED_DIR = Path("/app/generated")

# In-memory runner state per project
_runners: dict[str, dict] = {}

# Strong references to background tasks — prevents GC in Python 3.12+
_background_tasks: set[asyncio.Task] = set()


class ProxyRequest(BaseModel):
    port: int
    method: str
    path: str
    body: str | None = None
    headers: dict[str, str] = {}


def _find_free_port(start: int = 9100, end: int = 9200) -> int:
    """Find a free port in the given range."""
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    return start


async def _generate_and_write(project_id: UUID, repo, flow_to_ir, func_repo) -> tuple[list, str, object]:
    """Generate code + Docker files and write to disk. Returns (files, output_dir, ir)."""
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.flow.nodes:
        raise HTTPException(status_code=400, detail="Flow graph is empty")

    function_definitions = await func_repo.get_functions_by_project(project_id)
    ir = flow_to_ir.convert(project.config, project.flow, function_definitions)

    generator = None
    for g in GENERATORS:
        if g.supports(ir.language, ir.framework):
            generator = g
            break

    if not generator:
        raise HTTPException(status_code=400, detail=f"No generator for {ir.language}/{ir.framework}")

    files = generator.generate(ir)
    if not files:
        raise HTTPException(status_code=400, detail="No files generated")

    # Append Docker files
    files.extend(generate_docker_files(ir))

    # Write to disk
    output_dir = GENERATED_DIR / str(project_id)
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for f in files:
        file_path = output_dir / f.path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(f.content)

    return files, str(output_dir), ir


async def _run_command(cmd: list[str], cwd: str, env: dict | None = None) -> tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
        env=env,
    )
    stdout, stderr = await process.communicate()
    return process.returncode, stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")


async def _build_and_stream(pid: str, compose_project: str, output_dir: str, compose_env: dict, app_port: int):
    """Background: run docker compose up --build (attached), stream output to log buffer."""
    runner = _runners.get(pid)
    if not runner:
        return

    try:
        process = await asyncio.create_subprocess_exec(
            "docker", "compose", "--progress=plain", "--ansi=never",
            "-p", compose_project, "up", "--build",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=output_dir,
            env=compose_env,
        )
    except Exception as exc:
        r = _runners.get(pid)
        if r:
            r["logs"].append(f"[ERROR] Failed to start Docker: {exc}")
        return

    runner["log_process"] = process

    try:
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").rstrip()
            r = _runners.get(pid)
            if r:
                r["logs"].append(text)
    except Exception as exc:
        r = _runners.get(pid)
        if r:
            r["logs"].append(f"[ERROR] Log streaming error: {exc}")

    rc = await process.wait()
    r = _runners.get(pid)
    if r:
        if rc != 0:
            r["logs"].append(f"[ERROR] Docker exited with code {rc}")
        r["logs"].append("[Containers stopped]")


@router.post("/{project_id}/run")
async def start_runner(
    project_id: UUID,
    repo: ProjectRepositoryPort = Depends(get_repository),
    flow_to_ir: FlowToIRService = Depends(get_flow_to_ir_service),
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    """Generate code, write to disk, start via docker compose."""
    pid = str(project_id)
    compose_project = f"ff-{pid[:8]}"

    # Stop existing runner if any
    if pid in _runners and _runners[pid].get("log_process"):
        await _stop_compose(pid)

    # Generate and write files (fast, synchronous-ish)
    files, output_dir, ir = await _generate_and_write(project_id, repo, flow_to_ir, func_repo)

    # Find free ports for the host
    app_port = _find_free_port(9100, 9200)
    db_port = _find_free_port(9200, 9300)

    compose_env = {
        **os.environ,
        "APP_PORT": str(app_port),
        "DB_PORT": str(db_port),
    }

    # Store runner state with initial logs BEFORE returning
    log_lines: list[str] = [
        f"> Generated {len(files)} files",
        f"> Building Docker image ({ir.language}/{ir.framework})...",
    ]

    _runners[pid] = {
        "compose_project": compose_project,
        "log_process": None,
        "port": app_port,
        "db_port": db_port,
        "logs": log_lines,
        "output_dir": output_dir,
    }

    # Kick off build + run in background — returns immediately
    task = asyncio.create_task(_build_and_stream(pid, compose_project, output_dir, compose_env, app_port))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return {"status": "building", "port": app_port, "file_count": len(files)}


async def _stop_compose(pid: str):
    """Stop docker compose for a project: kill the attached process, then run docker compose down."""
    runner = _runners.get(pid)
    if not runner:
        return

    compose_project = runner.get("compose_project", f"ff-{pid[:8]}")
    output_dir = runner.get("output_dir", "")

    # Kill the attached docker compose up process
    log_process = runner.get("log_process")
    if log_process and log_process.returncode is None:
        try:
            log_process.terminate()
            await asyncio.wait_for(log_process.wait(), timeout=5)
        except (asyncio.TimeoutError, ProcessLookupError):
            try:
                log_process.kill()
            except Exception:
                pass

    # docker compose down to clean up containers
    if output_dir:
        await _run_command(
            ["docker", "compose", "-p", compose_project, "down", "--remove-orphans"],
            cwd=output_dir,
            env=dict(os.environ),
        )


@router.delete("/{project_id}/run")
async def stop_runner(project_id: UUID):
    """Stop the running docker compose project."""
    pid = str(project_id)
    runner = _runners.get(pid)
    if not runner:
        return {"status": "stopped"}

    await _stop_compose(pid)

    runner["logs"].append("> Stopped.")
    _runners[pid] = {**runner, "log_process": None}
    return {"status": "stopped"}


@router.get("/{project_id}/run/status")
async def runner_status(project_id: UUID):
    """Check if a runner is active for the project."""
    pid = str(project_id)
    runner = _runners.get(pid)
    if not runner:
        return {"running": False}

    log_process = runner.get("log_process")
    running = log_process is not None and log_process.returncode is None
    return {"running": running, "port": runner.get("port")}


@router.websocket("/{project_id}/run/logs")
async def stream_logs(websocket: WebSocket, project_id: UUID):
    """WebSocket endpoint to stream runner logs."""
    await websocket.accept()
    pid = str(project_id)

    last_sent = 0
    try:
        while True:
            logs = _runners.get(pid, {}).get("logs", [])
            if len(logs) > last_sent:
                for line in logs[last_sent:]:
                    await websocket.send_text(line)
                last_sent = len(logs)
            await asyncio.sleep(0.3)
    except WebSocketDisconnect:
        pass


@router.post("/run/proxy")
async def proxy_request(req: ProxyRequest):
    """Proxy an HTTP request to the running dev server."""
    target_url = f"http://localhost:{req.port}{req.path}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=req.method,
                url=target_url,
                content=req.body if req.body else None,
                headers={k: v for k, v in req.headers.items() if k.lower() != "host"},
            )

        try:
            body = response.text
        except Exception:
            body = str(response.content)

        return {
            "status": response.status_code,
            "status_text": response.reason_phrase,
            "headers": dict(response.headers),
            "body": body,
        }
    except httpx.ConnectError:
        return {"proxy_error": "Cannot connect to the running server. Is it still starting?"}
    except httpx.TimeoutException:
        return {"proxy_error": "Request timed out (30s)"}
    except Exception as e:
        return {"proxy_error": str(e)}
