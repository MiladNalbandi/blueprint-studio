"""Celery configuration and background tasks."""

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "flowforge",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min max per generation
)


@celery_app.task(bind=True, name="generate_code")
def generate_code_task(self, project_id: str, provider: str = "claude"):
    """Background task for code generation.
    
    Used for heavy generation jobs. For simple flows, 
    the synchronous /generate endpoint is fine.
    """
    # Import here to avoid circular imports
    import asyncio
    from uuid import UUID
    from app.adapters.persistence.database import async_session
    from app.adapters.persistence.postgres_repository import PostgresProjectRepository
    from app.domain.services.flow_to_ir import FlowToIRService
    from app.api.routes.generate import GENERATORS

    async def _run():
        async with async_session() as session:
            repo = PostgresProjectRepository(session)
            project = await repo.get(UUID(project_id))
            if not project:
                return {"error": "Project not found"}

            flow_to_ir = FlowToIRService()
            ir = flow_to_ir.convert(project.config, project.flow)

            generator = None
            for g in GENERATORS:
                if g.supports(ir.language, ir.framework):
                    generator = g
                    break

            if not generator:
                return {"error": f"No generator for {ir.language}/{ir.framework}"}

            files = generator.generate(ir)
            return {
                "status": "completed",
                "file_count": len(files),
                "files": [{"path": f.path} for f in files],
            }

    return asyncio.run(_run())
