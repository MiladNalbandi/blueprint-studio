"""Code generation endpoint."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.adapters.generators.llm_fallback.generator import LLMFallbackGenerator
from app.adapters.generators.php_symfony.generator import SymfonyGenerator
from app.adapters.generators.ts_fastify.generator import FastifyGenerator
from app.adapters.generators.python_fastapi.generator import FastAPIGenerator
from app.adapters.generators.ts_nestjs.generator import NestJSGenerator
from app.adapters.generators.go_gin.generator import GoGinGenerator
from app.adapters.generators.java_spring.generator import SpringBootGenerator
from app.adapters.generators.docker.docker_generator import generate_docker_files
from app.adapters.llm.factory import create_llm_provider
from app.api.dependencies import get_repository, get_flow_to_ir_service, get_exporter, get_function_repository
from app.api.schemas.schemas import GenerateRequest
from app.domain.services.flow_to_ir import FlowToIRService
from app.ports.interfaces import FileExporterPort, FunctionRepositoryPort, ProjectRepositoryPort

logger = logging.getLogger(__name__)

router = APIRouter()

# Generator registry — add new generators here
GENERATORS = [
    SymfonyGenerator(),
    FastifyGenerator(),
    FastAPIGenerator(),
    NestJSGenerator(),
    GoGinGenerator(),
    SpringBootGenerator(),
]


@router.post("/{project_id}/generate")
async def generate_code(
    project_id: UUID,
    body: GenerateRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
    flow_to_ir: FlowToIRService = Depends(get_flow_to_ir_service),
    exporter: FileExporterPort = Depends(get_exporter),
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.flow.nodes:
        raise HTTPException(status_code=400, detail="Flow graph is empty")

    # Load function definitions for method implementations
    function_definitions = await func_repo.get_functions_by_project(project_id)

    # Convert flow → IR (with function bodies)
    ir = flow_to_ir.convert(project.config, project.flow, function_definitions)

    # Find matching template generator
    generator = None
    for g in GENERATORS:
        if g.supports(ir.language, ir.framework):
            generator = g
            break

    if generator:
        files = generator.generate(ir)
    else:
        # LLM fallback for unsupported stacks
        files = await _llm_fallback_generate(ir, repo, project_id)

    if not files:
        raise HTTPException(status_code=400, detail="No files generated — check your flow graph")

    # Append Docker files (Dockerfile + docker-compose.yml)
    files.extend(generate_docker_files(ir))

    # Export as zip
    zip_bytes = exporter.export_zip(files, project.name.replace(" ", "_"))

    return StreamingResponse(
        iter([zip_bytes]),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{project.name}.zip"'},
    )


@router.post("/{project_id}/generate/preview")
async def preview_generation(
    project_id: UUID,
    repo: ProjectRepositoryPort = Depends(get_repository),
    flow_to_ir: FlowToIRService = Depends(get_flow_to_ir_service),
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    """Preview generated files without downloading."""
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    function_definitions = await func_repo.get_functions_by_project(project_id)
    ir = flow_to_ir.convert(project.config, project.flow, function_definitions)

    generator = None
    for g in GENERATORS:
        if g.supports(ir.language, ir.framework):
            generator = g
            break

    if generator:
        files = generator.generate(ir)
        files.extend(generate_docker_files(ir))
        return {"files": [{"path": f.path, "content": f.content} for f in files]}

    # LLM fallback for unsupported stacks
    try:
        files = await _llm_fallback_generate(ir, repo, project_id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("LLM fallback preview failed")
        return {
            "files": [],
            "warning": f"No template generator for {ir.language}/{ir.framework} and LLM generation failed. Try again.",
        }

    if not files:
        return {
            "files": [],
            "warning": "LLM returned no files. Add more nodes to your flow.",
        }

    files.extend(generate_docker_files(ir))

    return {
        "files": [{"path": f.path, "content": f.content} for f in files],
        "generated_by": "llm",
    }


async def _llm_fallback_generate(ir, repo, project_id):
    """Use project's LLM config to generate code when no template generator matches."""
    configs = await repo.get_llm_configs(project_id)
    if not configs:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No template generator for {ir.language}/{ir.framework}. "
                "Configure an LLM provider to enable AI-powered generation."
            ),
        )

    cfg = configs[0]
    provider = create_llm_provider(
        provider=cfg.provider,
        api_key=cfg.api_key_encrypted,
        model=cfg.model,
        temperature=cfg.temperature,
    )

    try:
        files = await LLMFallbackGenerator().generate(ir, provider)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM output: {exc}. Try again.")
    except Exception as exc:
        logger.exception("LLM generation failed")
        raise HTTPException(status_code=502, detail=f"LLM generation failed: {exc}")

    return files
