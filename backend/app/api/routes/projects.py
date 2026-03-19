"""Project CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_repository
from app.api.schemas.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from app.domain.models.project import Language, Architecture, Project, ProjectConfig
from app.ports.interfaces import ProjectRepositoryPort

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: ProjectCreate, repo: ProjectRepositoryPort = Depends(get_repository)):
    project = Project(
        name=body.name,
        config=ProjectConfig(
            language=Language(body.config.language),
            framework=body.config.framework,
            database=body.config.database,
            orm=body.config.orm,
            architecture=Architecture(body.config.architecture),
        ),
    )
    saved = await repo.save(project)
    return _to_response(saved)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(repo: ProjectRepositoryPort = Depends(get_repository)):
    projects = await repo.list_all()
    return [_to_response(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, repo: ProjectRepositoryPort = Depends(get_repository)):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: UUID, body: ProjectUpdate, repo: ProjectRepositoryPort = Depends(get_repository)):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if body.name is not None:
        project.name = body.name
    if body.config is not None:
        project.config = ProjectConfig(
            language=Language(body.config.language),
            framework=body.config.framework,
            database=body.config.database,
            orm=body.config.orm,
            architecture=Architecture(body.config.architecture),
        )
    saved = await repo.save(project)
    return _to_response(saved)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, repo: ProjectRepositoryPort = Depends(get_repository)):
    deleted = await repo.delete(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")


def _to_response(project: Project) -> dict:
    return {
        "id": project.id,
        "name": project.name,
        "config": {
            "language": project.config.language.value,
            "framework": project.config.framework,
            "database": project.config.database,
            "orm": project.config.orm,
            "architecture": project.config.architecture.value,
        },
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
