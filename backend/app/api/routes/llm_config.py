"""LLM provider configuration endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_repository
from app.api.schemas.schemas import LLMConfigCreate, LLMConfigResponse
from app.domain.models.project import LLMProviderConfig
from app.ports.interfaces import ProjectRepositoryPort

router = APIRouter()


@router.post("/{project_id}/llm-configs", response_model=LLMConfigResponse, status_code=201)
async def create_llm_config(
    project_id: UUID,
    body: LLMConfigCreate,
    repo: ProjectRepositoryPort = Depends(get_repository),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # TODO: encrypt api_key before storing
    config = LLMProviderConfig(
        project_id=project_id,
        provider=body.provider,
        model=body.model,
        api_key_encrypted=body.api_key,  # encrypt this!
        base_url=body.base_url,
        temperature=body.temperature,
    )
    saved = await repo.save_llm_config(config)
    return {
        "id": saved.id,
        "provider": saved.provider,
        "model": saved.model,
        "base_url": saved.base_url,
        "temperature": saved.temperature,
        "has_api_key": bool(saved.api_key_encrypted),
    }


@router.get("/{project_id}/llm-configs", response_model=list[LLMConfigResponse])
async def list_llm_configs(
    project_id: UUID,
    repo: ProjectRepositoryPort = Depends(get_repository),
):
    configs = await repo.get_llm_configs(project_id)
    return [
        {
            "id": c.id,
            "provider": c.provider,
            "model": c.model,
            "base_url": c.base_url,
            "temperature": c.temperature,
            "has_api_key": bool(c.api_key_encrypted),
        }
        for c in configs
    ]
