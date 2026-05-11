"""AI Chat endpoint — WebSocket for streaming, REST for simple request/response."""

import json
import sys
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from app.api.dependencies import get_repository, get_chat_repository
from app.api.schemas.schemas import (
    ChatRequest,
    ChatResponse,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
)
from app.adapters.llm.factory import create_llm_provider
from app.ports.interfaces import ProjectRepositoryPort, ChatRepositoryPort

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

NODE CONFIG SHAPES (use these when creating or editing nodes):

endpoint:
  method: string (GET|POST|PUT|PATCH|DELETE)
  path: string (e.g. "/api/users")
  description: string

dto:
  fields: [{{ name: string, type: string }}]
  description: string

validator:
  rules: [{{ field: string, rule: string (required|email|min|max|regex|unique|exists|...) }}]
  onFail: string (HTTP status, e.g. "422")

logic:
  condition: string (e.g. "user.isAdmin")
  outputs: number (number of branches, default 2)
  description: string

entity:
  tableName: string
  fields: [{{ name, type (integer|bigint|string|text|boolean|float|decimal|date|datetime|json|uuid), primary?, nullable?, unique?, defaultValue? }}]
  relations: [{{ type (belongsTo|hasOne|hasMany|manyToMany), target (entity name), foreignKey?, pivotTable? (manyToMany only) }}]
  indexes: [{{ columns: [col names], unique?, name? }}]

response:
  status: number (HTTP status code, e.g. 200, 201, 404)
  type: string (json|xml|text|html)
  description: string

middleware:
  type: string (auth|cors|rate-limit|logging|validation|custom)
  description: string

service:
  name: string (e.g. "UserService")
  methods: [string] (e.g. ["createUser", "findByEmail"])
  description: string
  functions: [{{ name, params: [{{name, type}}], returnType, code, description }}]

repository:
  entity: string (name of the entity this repo manages)
  methods: [string] (e.g. ["findAll", "findById", "save", "delete"])
  functions: [{{ name, params: [{{name, type}}], returnType, code, description }}]

event:
  name: string (e.g. "UserCreated")
  payload: string (description of event data)
  async: boolean

ACTIONS — respond with a JSON block in ```json``` markers. All three arrays are optional — include only what's needed:

1. CREATE new nodes:
  "nodes": [{{"tempId": "temp_1", "type": "endpoint", "label": "Create User", "config": {{...}}}}]

2. CONNECT nodes with edges (can use tempIds for new nodes AND existing node IDs from the canvas):
  "edges": [{{"from": "temp_1", "to": "existing_node_id"}}]

3. EDIT existing nodes (use the node ID from CURRENT CANVAS NODES):
  "edits": [{{"nodeId": "existing_node_id", "label": "New Label", "config": {{...}}}}]

Example JSON block:
```json
{{
  "nodes": [{{"tempId": "temp_1", "type": "repository", "label": "UserRepo", "config": {{"entity": "User", "methods": ["findAll", "findById", "save", "delete"]}}}}],
  "edges": [{{"from": "temp_1", "to": "some_existing_entity_id"}}],
  "edits": [{{"nodeId": "some_existing_endpoint_id", "label": "Update User", "config": {{"method": "PUT", "path": "/api/users/{{id}}", "description": "Update user by ID"}}}}]
}}
```

FLOW DIRECTION CONVENTION:
- Data flows LEFT to RIGHT: endpoint → dto → validator → logic → service → repository → entity
- "from" = upstream node, "to" = downstream node
- Response nodes connect FROM endpoints. Middleware connects TO endpoints.

CONFIG COMPLETENESS RULES:
- entity: ALWAYS include tableName (snake_case plural), ALL fields with types, always include 'id' primary key field
- endpoint: Use descriptive RESTful paths, set correct HTTP method
- service: Include PascalCase name and concrete method names
- repository: Set 'entity' to the exact label of the connected entity. Add domain-specific finder methods.
- validator: Add specific rules per field (required, in:val1,val2, etc.)
- logic: Write human-readable conditions (e.g. "carrier === 'DHL'")

FUNCTION IMPLEMENTATIONS:
When creating service or repository nodes, ALWAYS include a "functions" array with actual implementation code for each method.
Each function object: {{ name, params: [{{name, type}}], returnType, code (function body only — idiomatic {language}/{framework} code), description }}
- "code" should be the function body only (no function signature/declaration), written in idiomatic {language}/{framework} style.
- Include proper error handling, type hints, and framework-specific patterns.
- For repositories, use the project's ORM ({orm}) patterns.

MULTI-NODE EXAMPLE — a "Labels" table + print endpoint scenario:

```json
{{
  "nodes": [
    {{"tempId": "t1", "type": "endpoint", "label": "Generate PDF", "config": {{"method": "POST", "path": "/api/labels/generate-pdf", "description": "Generate a shipping label PDF"}}}},
    {{"tempId": "t2", "type": "dto", "label": "LabelRequest", "config": {{"fields": [{{"name": "orderId", "type": "string"}}, {{"name": "carrier", "type": "string"}}, {{"name": "format", "type": "string"}}]}}}},
    {{"tempId": "t3", "type": "validator", "label": "LabelValidator", "config": {{"rules": [{{"field": "orderId", "rule": "required"}}, {{"field": "carrier", "rule": "in:DHL,UPS,FedEx"}}, {{"field": "format", "rule": "in:A4,A6"}}], "onFail": "422"}}}},
    {{"tempId": "t4", "type": "logic", "label": "Carrier Router", "config": {{"condition": "carrier", "outputs": 3, "description": "Route by carrier: DHL / UPS / FedEx"}}}},
    {{"tempId": "t5", "type": "service", "label": "LabelService", "config": {{"name": "LabelService", "methods": ["generatePdf", "findByOrder"], "description": "Orchestrates label generation", "functions": [{{"name": "generatePdf", "params": [{{"name": "orderId", "type": "string"}}, {{"name": "carrier", "type": "string"}}, {{"name": "format", "type": "string"}}], "returnType": "Label", "code": "const order = await this.orderRepo.findById(orderId);\nif (!order) throw new NotFoundException('Order not found');\nconst label = await this.labelRepo.save({{ orderId, carrier, format }});\nconst pdfUrl = await this.pdfService.generate(label);\nreturn {{ ...label, pdfUrl }};", "description": "Generate a shipping label PDF for an order"}}, {{"name": "findByOrder", "params": [{{"name": "orderId", "type": "string"}}], "returnType": "Label[]", "code": "return await this.labelRepo.findByOrderId(orderId);", "description": "Find all labels for a given order"}}]}}}},
    {{"tempId": "t6", "type": "repository", "label": "LabelRepo", "config": {{"entity": "Label", "methods": ["findAll", "findById", "findByOrderId", "save", "delete"], "functions": [{{"name": "findByOrderId", "params": [{{"name": "orderId", "type": "string"}}], "returnType": "Label[]", "code": "return await this.repository.find({{ where: {{ orderId }} }});", "description": "Find labels by order ID"}}]}}}},
    {{"tempId": "t7", "type": "entity", "label": "Label", "config": {{"tableName": "labels", "fields": [{{"name": "id", "type": "integer", "primary": true}}, {{"name": "orderId", "type": "string"}}, {{"name": "carrier", "type": "string"}}, {{"name": "format", "type": "string"}}, {{"name": "pdfUrl", "type": "string", "nullable": true}}, {{"name": "createdAt", "type": "datetime"}}], "relations": [], "indexes": [{{"columns": ["orderId"]}}]}}}},
    {{"tempId": "t8", "type": "response", "label": "201 Created", "config": {{"status": 201, "type": "json", "description": "Returns created label with PDF URL"}}}}
  ],
  "edges": [
    {{"from": "t1", "to": "t2"}},
    {{"from": "t2", "to": "t3"}},
    {{"from": "t3", "to": "t4"}},
    {{"from": "t4", "to": "t5"}},
    {{"from": "t5", "to": "t6"}},
    {{"from": "t6", "to": "t7"}},
    {{"from": "t1", "to": "t8"}}
  ]
}}
```

Keep explanations SHORT (1-3 sentences). Always include proper config matching the shapes above."""


def build_system_prompt(project, referenced_node_ids: list[str] | None = None) -> str:
    nodes_str = "\n".join(
        f"  - id: {n.id}, type: {n.type}, label: {n.label}, config: {json.dumps(n.config)}"
        for n in project.flow.nodes
    ) or "  (empty)"
    edges_str = "\n".join(
        f"  - {e.source} → {e.target}"
        for e in project.flow.edges
    ) or "  (none)"

    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        language=project.config.language.value,
        framework=project.config.framework,
        database=project.config.database or "none",
        orm=project.config.orm or "none",
        architecture=project.config.architecture.value,
        nodes=nodes_str,
        edges=edges_str,
    )

    # Framework-specific hints
    fw = project.config.framework.lower()
    if fw == "symfony":
        prompt += "\nFRAMEWORK NOTES (Symfony):\n- Controllers use __invoke pattern\n- Services injected via constructor DI\n- Use Doctrine ORM attributes\n"
    elif fw == "laravel":
        prompt += "\nFRAMEWORK NOTES (Laravel):\n- Controllers use resource methods (index, store, show, update, destroy)\n- Use Eloquent ORM models\n- Validation via FormRequest classes\n"
    elif fw in ("express", "nestjs"):
        prompt += f"\nFRAMEWORK NOTES ({project.config.framework}):\n- Use decorators for routing\n- Services injected via DI container\n- TypeORM or Prisma for database access\n"

    # Append detailed context for @-mentioned nodes
    if referenced_node_ids:
        ref_ids = set(referenced_node_ids)
        ref_nodes = [n for n in project.flow.nodes if n.id in ref_ids]
        if ref_nodes:
            prompt += "\n\nREFERENCED NODES (explicitly mentioned by user with @):\n"
            for n in ref_nodes:
                prompt += f"  - id: {n.id}, type: {n.type}, label: {n.label}\n"
                prompt += f"    Full config: {json.dumps(n.config, indent=2)}\n"
            prompt += "Pay special attention to these nodes — the user is asking about them specifically."

    return prompt


# ─── Session CRUD ────────────────────────────────────────

@router.get("/{project_id}/chat/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    project_id: UUID,
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
):
    sessions = await chat_repo.list_sessions(project_id)
    return [
        ChatSessionResponse(
            id=s.id, project_id=s.project_id, title=s.title,
            created_at=s.created_at, updated_at=s.updated_at, message_count=s.message_count,
        )
        for s in sessions
    ]


@router.post("/{project_id}/chat/sessions", response_model=ChatSessionResponse)
async def create_session(
    project_id: UUID,
    body: ChatSessionCreate,
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
):
    session = await chat_repo.create_session(project_id, body.title)
    return ChatSessionResponse(
        id=session.id, project_id=session.project_id, title=session.title,
        created_at=session.created_at, updated_at=session.updated_at, message_count=0,
    )


@router.delete("/{project_id}/chat/sessions/{session_id}")
async def delete_session(
    project_id: UUID,
    session_id: UUID,
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
):
    deleted = await chat_repo.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@router.patch("/{project_id}/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    project_id: UUID,
    session_id: UUID,
    body: ChatSessionUpdate,
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
):
    session = await chat_repo.update_session_title(session_id, body.title)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionResponse(
        id=session.id, project_id=session.project_id, title=session.title,
        created_at=session.created_at, updated_at=session.updated_at, message_count=session.message_count,
    )


@router.get("/{project_id}/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_session_messages(
    project_id: UUID,
    session_id: UUID,
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
):
    messages = await chat_repo.get_messages(session_id)
    return [
        ChatMessageResponse(
            id=m.id, session_id=m.session_id, role=m.role,
            content=m.content, nodes_created=m.nodes_created, created_at=m.created_at,
        )
        for m in messages
    ]


# ─── Chat (send message) ────────────────────────────────

@router.post("/{project_id}/chat", response_model=ChatResponse)
async def chat(
    project_id: UUID,
    body: ChatRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
    chat_repo: ChatRepositoryPort = Depends(get_chat_repository),
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

    system = build_system_prompt(project, body.referenced_node_ids)
    messages = [{"role": m.role, "content": m.content} for m in body.history]
    messages.append({"role": "user", "content": body.message})

    reply = await provider.chat(messages, system=system)
    print(f"[Chat] AI reply:\n{reply}", flush=True)

    # Parse any node creation / edit JSON
    nodes_created = None
    if "```json" in reply:
        try:
            json_str = reply.split("```json")[1].split("```")[0].strip()
            nodes_created = json.loads(json_str)
            print(f"[Chat] Parsed nodes_created: {json.dumps(nodes_created, indent=2)}", flush=True)
        except (json.JSONDecodeError, IndexError) as exc:
            print(f"[Chat] Failed to parse JSON block from AI reply: {exc}", flush=True)

    # Persist messages if session_id provided
    session_id = body.session_id
    if session_id:
        try:
            sid = UUID(session_id)
            await chat_repo.save_message(sid, project_id, "user", body.message)
            await chat_repo.save_message(sid, project_id, "assistant", reply, nodes_created)
            # Auto-title on first message
            session_messages = await chat_repo.get_messages(sid)
            if len(session_messages) <= 2:
                title = body.message[:50].strip()
                if title:
                    await chat_repo.update_session_title(sid, title)
        except Exception as exc:
            print(f"[Chat] Failed to persist messages: {exc}", flush=True)

    return ChatResponse(reply=reply, nodes_created=nodes_created, session_id=session_id)


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
