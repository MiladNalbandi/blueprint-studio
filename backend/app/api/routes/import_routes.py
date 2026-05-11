"""OpenAPI import endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.api.dependencies import get_repository
from app.domain.services.openapi_parser import OpenAPIParser
from app.ports.interfaces import ProjectRepositoryPort

router = APIRouter()


class OpenAPIImportRequest(BaseModel):
    spec: dict


@router.post("/{project_id}/import/openapi")
async def import_openapi(
    project_id: UUID,
    body: OpenAPIImportRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
):
    """Import an OpenAPI spec into canvas nodes."""
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    spec = body.spec
    if not isinstance(spec, dict):
        raise HTTPException(status_code=400, detail="Invalid OpenAPI spec: must be a JSON object")

    # Basic validation
    if "openapi" not in spec and "swagger" not in spec:
        raise HTTPException(status_code=400, detail="Invalid OpenAPI spec: missing 'openapi' or 'swagger' version field")

    parser = OpenAPIParser()
    try:
        result = parser.parse(spec)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse OpenAPI spec: {e}")

    return {"nodes_created": result}
