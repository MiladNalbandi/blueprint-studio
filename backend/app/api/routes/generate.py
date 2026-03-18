"""Code generation endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_repository, get_flow_to_ir_service, get_exporter
from app.api.schemas.schemas import GenerateRequest
from app.adapters.generators.php_symfony.generator import SymfonyGenerator
from app.domain.services.flow_to_ir import FlowToIRService
from app.ports.interfaces import FileExporterPort, ProjectRepositoryPort

router = APIRouter()

# Generator registry — add new generators here
GENERATORS = [
    SymfonyGenerator(),
]


@router.post("/{project_id}/generate")
async def generate_code(
    project_id: UUID,
    body: GenerateRequest,
    repo: ProjectRepositoryPort = Depends(get_repository),
    flow_to_ir: FlowToIRService = Depends(get_flow_to_ir_service),
    exporter: FileExporterPort = Depends(get_exporter),
):
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.flow.nodes:
        raise HTTPException(status_code=400, detail="Flow graph is empty")

    # Convert flow → IR
    ir = flow_to_ir.convert(project.config, project.flow)

    # Find matching generator
    generator = None
    for g in GENERATORS:
        if g.supports(ir.language, ir.framework):
            generator = g
            break

    if not generator:
        raise HTTPException(
            status_code=400,
            detail=f"No generator available for {ir.language}/{ir.framework}",
        )

    # Generate files
    files = generator.generate(ir)

    if not files:
        raise HTTPException(status_code=400, detail="No files generated — check your flow graph")

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
):
    """Preview generated files without downloading."""
    project = await repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ir = flow_to_ir.convert(project.config, project.flow)

    generator = None
    for g in GENERATORS:
        if g.supports(ir.language, ir.framework):
            generator = g
            break

    if not generator:
        raise HTTPException(status_code=400, detail=f"No generator for {ir.language}/{ir.framework}")

    files = generator.generate(ir)
    return {"files": [{"path": f.path, "content": f.content} for f in files]}
