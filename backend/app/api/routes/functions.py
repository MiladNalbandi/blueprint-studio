"""Function Builder API — CRUD + AI generation for function implementations."""

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_repository, get_function_repository
from app.api.schemas.schemas import (
    FunctionCreate, FunctionUpdate, FunctionGenerateRequest,
    FunctionResponse, FunctionRevisionResponse, FunctionGenerateResponse,
    FunctionParamSchema,
)
from app.adapters.llm.factory import create_llm_provider
from app.domain.models.project import FunctionDefinition, FunctionParam, FunctionRevision
from app.domain.services.function_generator import FunctionGeneratorService
from app.ports.interfaces import ProjectRepositoryPort, FunctionRepositoryPort

router = APIRouter()


def _to_response(func: FunctionDefinition) -> FunctionResponse:
    return FunctionResponse(
        id=func.id,
        project_id=func.project_id,
        node_id=func.node_id,
        name=func.name,
        description=func.description,
        params=[FunctionParamSchema(name=p.name, type=p.type, default_value=p.default_value) for p in func.params],
        return_type=func.return_type,
        current_code=func.current_code,
        current_prompt=func.current_prompt,
        is_ai_generated=func.is_ai_generated,
        created_at=func.created_at,
        updated_at=func.updated_at,
    )


def _to_revision_response(rev: FunctionRevision) -> FunctionRevisionResponse:
    return FunctionRevisionResponse(
        id=rev.id,
        function_id=rev.function_id,
        revision_number=rev.revision_number,
        code=rev.code,
        prompt=rev.prompt,
        provider=rev.provider,
        model=rev.model,
        diff_from_previous=rev.diff_from_previous,
        created_at=rev.created_at,
    )


@router.get("/{project_id}/functions", response_model=list[FunctionResponse])
async def list_functions(
    project_id: UUID,
    node_id: str | None = None,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    functions = await func_repo.list_functions(project_id, node_id)
    return [_to_response(f) for f in functions]


@router.post("/{project_id}/functions", response_model=FunctionResponse, status_code=201)
async def create_function(
    project_id: UUID,
    body: FunctionCreate,
    repo: ProjectRepositoryPort = Depends(get_repository),
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    func = FunctionDefinition(
        id=uuid4(),
        project_id=project_id,
        node_id=body.node_id,
        name=body.name,
        description=body.description,
        params=[FunctionParam(name=p.name, type=p.type, default_value=p.default_value) for p in body.params],
        return_type=body.return_type,
        current_code=body.current_code or "",
        current_prompt=body.current_prompt or "",
        is_ai_generated=body.is_ai_generated,
    )
    saved = await func_repo.save_function(func)
    return _to_response(saved)


@router.get("/{project_id}/functions/{function_id}", response_model=FunctionResponse)
async def get_function(
    project_id: UUID,
    function_id: UUID,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")
    return _to_response(func)


@router.patch("/{project_id}/functions/{function_id}", response_model=FunctionResponse)
async def update_function(
    project_id: UUID,
    function_id: UUID,
    body: FunctionUpdate,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")

    updates = body.model_dump(exclude_unset=True)
    if "params" in updates and updates["params"] is not None:
        updates["params"] = [FunctionParam(name=p.name, type=p.type, default_value=p.default_value) for p in body.params]

    updated = await func_repo.update_function(function_id, **updates)
    return _to_response(updated)


@router.delete("/{project_id}/functions/{function_id}", status_code=204)
async def delete_function(
    project_id: UUID,
    function_id: UUID,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")

    await func_repo.delete_function(function_id)


@router.post("/{project_id}/functions/{function_id}/generate", response_model=FunctionGenerateResponse)
async def generate_function(
    project_id: UUID,
    function_id: UUID,
    body: FunctionGenerateRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")

    # Get LLM config
    llm_configs = await repo.get_llm_configs(project_id)
    if not llm_configs:
        raise HTTPException(status_code=400, detail="No LLM provider configured")

    # Use requested provider or first available
    cfg = llm_configs[0]
    if body.provider:
        matching = [c for c in llm_configs if c.provider == body.provider]
        if matching:
            cfg = matching[0]

    llm = create_llm_provider(cfg.provider, cfg.api_key_encrypted, cfg.model, cfg.temperature)

    # Find the parent node and connected nodes for context
    node = None
    connected_nodes = []
    for n in project.flow.nodes:
        if n.id == func.node_id:
            node = n
            break
    if node:
        connected_ids = set()
        for edge in project.flow.edges:
            if edge.source == node.id:
                connected_ids.add(edge.target)
            elif edge.target == node.id:
                connected_ids.add(edge.source)
        connected_nodes = [n for n in project.flow.nodes if n.id in connected_ids]

    # Resolve @-mentioned referenced nodes
    referenced_nodes = []
    if body.referenced_node_ids:
        ref_ids = set(body.referenced_node_ids)
        referenced_nodes = [n for n in project.flow.nodes if n.id in ref_ids]

    # Generate
    generator = FunctionGeneratorService()
    result = await generator.generate(func, body.prompt, project.config, llm, node, connected_nodes, referenced_nodes)

    # Count existing revisions
    existing_revisions = await func_repo.get_revisions(function_id)
    next_rev = len(existing_revisions) + 1

    # Save revision
    revision = FunctionRevision(
        id=uuid4(),
        function_id=function_id,
        revision_number=next_rev,
        code=result.code,
        prompt=body.prompt,
        provider=cfg.provider,
        model=cfg.model,
        diff_from_previous=result.diff,
    )
    saved_rev = await func_repo.save_revision(revision)

    # Update function with new code
    updated_func = await func_repo.update_function(
        function_id,
        current_code=result.code,
        current_prompt=body.prompt,
        is_ai_generated=True,
    )

    return FunctionGenerateResponse(
        function=_to_response(updated_func),
        revision=_to_revision_response(saved_rev),
    )


@router.get("/{project_id}/functions/{function_id}/revisions", response_model=list[FunctionRevisionResponse])
async def list_revisions(
    project_id: UUID,
    function_id: UUID,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")

    revisions = await func_repo.get_revisions(function_id)
    return [_to_revision_response(r) for r in revisions]


@router.post("/{project_id}/functions/{function_id}/revisions/{revision_id}/restore", response_model=FunctionResponse)
async def restore_revision(
    project_id: UUID,
    function_id: UUID,
    revision_id: UUID,
    func_repo: FunctionRepositoryPort = Depends(get_function_repository),
):
    func = await func_repo.get_function(function_id)
    if not func or func.project_id != project_id:
        raise HTTPException(status_code=404, detail="Function not found")

    revision = await func_repo.get_revision(revision_id)
    if not revision or revision.function_id != function_id:
        raise HTTPException(status_code=404, detail="Revision not found")

    # Create a new revision for the restore action
    existing_revisions = await func_repo.get_revisions(function_id)
    next_rev = len(existing_revisions) + 1

    generator = FunctionGeneratorService()
    diff = generator._compute_diff(func.current_code, revision.code, func.name)

    restore_rev = FunctionRevision(
        id=uuid4(),
        function_id=function_id,
        revision_number=next_rev,
        code=revision.code,
        prompt=f"Restored from revision #{revision.revision_number}",
        provider="restore",
        model="",
        diff_from_previous=diff,
    )
    await func_repo.save_revision(restore_rev)

    # Update function
    updated = await func_repo.update_function(
        function_id,
        current_code=revision.code,
        current_prompt=revision.prompt,
    )

    return _to_response(updated)
