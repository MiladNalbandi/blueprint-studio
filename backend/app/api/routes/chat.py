"""AI Chat endpoint — WebSocket for streaming, REST for simple request/response."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from app.api.dependencies import get_repository
from app.api.schemas.schemas import ChatRequest, ChatResponse
from app.adapters.llm.factory import create_llm_provider
from app.ports.interfaces import ProjectRepositoryPort

router = APIRouter()

SYSTEM_PROMPT_TEMPLATE = """You are FlowForge AI, an assistant that helps users build visual code architecture flows.

PROJECT CONFIG:
- Language: {language}, Framework: {framework}
- Database: {database}, ORM: {orm}
- Architecture: {architecture}

CURRENT CANVAS NODES:
{nodes}

CURRENT EDGES:
{edges}

AVAILABLE NODE TYPES: endpoint, dto, validator, logic, entity, response, middleware, service, repository, event

When the user asks to create nodes, respond with a short explanation then a JSON block in ```json``` markers:
{{
  "nodes": [{{"tempId": "temp_1", "type": "endpoint", "label": "Name", "config": {{...}}}}],
  "edges": [{{"from": "temp_1", "to": "temp_2"}}]
}}

Keep explanations SHORT (1-3 sentences). Always include proper config for each node type."""


def build_system_prompt(project) -> str:
    nodes_str = "\n".join(
        f"  - id: {n.id}, type: {n.type}, label: {n.label}"
        for n in project.flow.nodes
    ) or "  (empty)"
    edges_str = "\n".join(
        f"  - {e.source} → {e.target}"
        for e in project.flow.edges
    ) or "  (none)"

    return SYSTEM_PROMPT_TEMPLATE.format(
        language=project.config.language.value,
        framework=project.config.framework,
        database=project.config.database or "none",
        orm=project.config.orm or "none",
        architecture=project.config.architecture.value,
        nodes=nodes_str,
        edges=edges_str,
    )


@router.post("/{project_id}/chat", response_model=ChatResponse)
async def chat(
    project_id: UUID,
    body: ChatRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get first available LLM config
    llm_configs = await repo.get_llm_configs(project_id)
    if not llm_configs:
        raise HTTPException(status_code=400, detail="No LLM provider configured")

    cfg = llm_configs[0]
    # TODO: decrypt api_key_encrypted
    provider = create_llm_provider(cfg.provider, cfg.api_key_encrypted, cfg.model, cfg.temperature)

    system = build_system_prompt(project)
    messages = [{"role": m.role, "content": m.content} for m in body.history]
    messages.append({"role": "user", "content": body.message})

    reply = await provider.chat(messages, system=system)

    # Parse any node creation JSON
    nodes_created = None
    if "```json" in reply:
        try:
            json_str = reply.split("```json")[1].split("```")[0].strip()
            nodes_created = json.loads(json_str)
        except (json.JSONDecodeError, IndexError):
            pass

    return ChatResponse(reply=reply, nodes_created=nodes_created)


@router.websocket("/{project_id}/chat/ws")
async def chat_ws(websocket: WebSocket, project_id: UUID):
    """WebSocket for streaming chat responses."""
    await websocket.accept()

    # We need a fresh session for WebSocket — import directly
    from app.adapters.persistence.database import async_session
    from app.adapters.persistence.postgres_repository import PostgresProjectRepository

    try:
        async with async_session() as session:
            repo = PostgresProjectRepository(session)
            project = await repo.get(project_id)
            if not project:
                await websocket.send_json({"error": "Project not found"})
                await websocket.close()
                return

            llm_configs = await repo.get_llm_configs(project_id)
            if not llm_configs:
                await websocket.send_json({"error": "No LLM configured"})
                await websocket.close()
                return

            cfg = llm_configs[0]
            provider = create_llm_provider(cfg.provider, cfg.api_key_encrypted, cfg.model, cfg.temperature)

            while True:
                data = await websocket.receive_json()
                message = data.get("message", "")
                history = data.get("history", [])

                # Rebuild system prompt with latest flow state
                project = await repo.get(project_id)
                system = build_system_prompt(project)

                messages = history + [{"role": "user", "content": message}]

                full_reply = ""
                async for token in provider.stream(messages, system=system):
                    full_reply += token
                    await websocket.send_json({"type": "token", "content": token})

                # Parse nodes if present
                nodes_created = None
                if "```json" in full_reply:
                    try:
                        json_str = full_reply.split("```json")[1].split("```")[0].strip()
                        nodes_created = json.loads(json_str)
                    except (json.JSONDecodeError, IndexError):
                        pass

                await websocket.send_json({
                    "type": "done",
                    "content": full_reply,
                    "nodes_created": nodes_created,
                })

    except WebSocketDisconnect:
        pass
