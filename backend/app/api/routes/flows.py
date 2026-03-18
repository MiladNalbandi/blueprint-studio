"""Flow graph save/load endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_repository
from app.api.schemas.schemas import FlowGraphSchema, FlowSaveRequest
from app.domain.models.project import FlowEdge, FlowGraph, FlowNode
from app.ports.interfaces import ProjectRepositoryPort

router = APIRouter()


@router.get("/{project_id}/flow", response_model=FlowGraphSchema)
async def get_flow(project_id: UUID, repo: ProjectRepositoryPort = Depends(get_repository)):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    flow = project.flow
    return {
        "nodes": [{"id": n.id, "type": n.type, "label": n.label, "x": n.x, "y": n.y, "config": n.config} for n in flow.nodes],
        "edges": [{"id": e.id, "source": e.source, "target": e.target} for e in flow.edges],
        "viewport": flow.viewport,
    }


@router.put("/{project_id}/flow")
async def save_flow(project_id: UUID, body: FlowSaveRequest, repo: ProjectRepositoryPort = Depends(get_repository)):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.flow = FlowGraph(
        nodes=[FlowNode(id=n.id, type=n.type, label=n.label, x=n.x, y=n.y, config=n.config) for n in body.flow.nodes],
        edges=[FlowEdge(id=e.id, source=e.source, target=e.target) for e in body.flow.edges],
        viewport=body.flow.viewport,
    )
    await repo.save(project)
    return {"status": "saved"}
