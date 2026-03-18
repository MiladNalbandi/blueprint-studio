"""FastAPI dependency injection."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.persistence.database import get_session
from app.adapters.persistence.postgres_repository import PostgresProjectRepository
from app.adapters.export.zip_exporter import ZipExporter
from app.domain.services.flow_to_ir import FlowToIRService
from app.ports.interfaces import ProjectRepositoryPort, FileExporterPort


async def get_repository(session: AsyncSession = Depends(get_session)) -> ProjectRepositoryPort:
    return PostgresProjectRepository(session)


def get_flow_to_ir_service() -> FlowToIRService:
    return FlowToIRService()


def get_exporter() -> FileExporterPort:
    return ZipExporter()
