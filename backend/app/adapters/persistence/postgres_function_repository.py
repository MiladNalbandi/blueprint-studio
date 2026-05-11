"""PostgreSQL adapter for function definitions and revisions."""

from uuid import UUID

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.adapters.persistence.models import FunctionDefinitionModel, FunctionRevisionModel
from app.domain.models.project import FunctionDefinition, FunctionParam, FunctionRevision
from app.ports.interfaces import FunctionRepositoryPort


class PostgresFunctionRepository(FunctionRepositoryPort):

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_function(self, func: FunctionDefinition) -> FunctionDefinition:
        model = FunctionDefinitionModel(
            id=func.id,
            project_id=func.project_id,
            node_id=func.node_id,
            name=func.name,
            description=func.description,
            params=[{"name": p.name, "type": p.type, "default_value": p.default_value} for p in func.params],
            return_type=func.return_type,
            current_code=func.current_code,
            current_prompt=func.current_prompt,
            is_ai_generated=func.is_ai_generated,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_domain(model)

    async def get_function(self, function_id: UUID) -> FunctionDefinition | None:
        result = await self.session.execute(
            select(FunctionDefinitionModel)
            .where(FunctionDefinitionModel.id == function_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model else None

    async def list_functions(self, project_id: UUID, node_id: str | None = None) -> list[FunctionDefinition]:
        stmt = select(FunctionDefinitionModel).where(FunctionDefinitionModel.project_id == project_id)
        if node_id:
            stmt = stmt.where(FunctionDefinitionModel.node_id == node_id)
        stmt = stmt.order_by(FunctionDefinitionModel.created_at)
        result = await self.session.execute(stmt)
        return [self._to_domain(m) for m in result.scalars().all()]

    async def update_function(self, function_id: UUID, **kwargs) -> FunctionDefinition | None:
        result = await self.session.execute(
            select(FunctionDefinitionModel).where(FunctionDefinitionModel.id == function_id)
        )
        model = result.scalar_one_or_none()
        if not model:
            return None

        for key, value in kwargs.items():
            if key == "params":
                value = [{"name": p.name, "type": p.type, "default_value": p.default_value} if isinstance(p, FunctionParam) else p for p in value]
            if hasattr(model, key):
                setattr(model, key, value)

        await self.session.commit()
        await self.session.refresh(model)
        return self._to_domain(model)

    async def delete_function(self, function_id: UUID) -> bool:
        result = await self.session.execute(
            sa_delete(FunctionDefinitionModel).where(FunctionDefinitionModel.id == function_id)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def save_revision(self, revision: FunctionRevision) -> FunctionRevision:
        model = FunctionRevisionModel(
            id=revision.id,
            function_id=revision.function_id,
            revision_number=revision.revision_number,
            code=revision.code,
            prompt=revision.prompt,
            provider=revision.provider,
            model=revision.model,
            diff_from_previous=revision.diff_from_previous,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._revision_to_domain(model)

    async def get_revisions(self, function_id: UUID) -> list[FunctionRevision]:
        result = await self.session.execute(
            select(FunctionRevisionModel)
            .where(FunctionRevisionModel.function_id == function_id)
            .order_by(FunctionRevisionModel.revision_number)
        )
        return [self._revision_to_domain(m) for m in result.scalars().all()]

    async def get_revision(self, revision_id: UUID) -> FunctionRevision | None:
        result = await self.session.execute(
            select(FunctionRevisionModel).where(FunctionRevisionModel.id == revision_id)
        )
        model = result.scalar_one_or_none()
        return self._revision_to_domain(model) if model else None

    async def get_functions_by_project(self, project_id: UUID) -> list[FunctionDefinition]:
        return await self.list_functions(project_id)

    def _to_domain(self, model: FunctionDefinitionModel) -> FunctionDefinition:
        params = [
            FunctionParam(
                name=p.get("name", ""),
                type=p.get("type", "string"),
                default_value=p.get("default_value"),
            )
            for p in (model.params or [])
        ]
        return FunctionDefinition(
            id=model.id,
            project_id=model.project_id,
            node_id=model.node_id,
            name=model.name,
            description=model.description,
            params=params,
            return_type=model.return_type,
            current_code=model.current_code,
            current_prompt=model.current_prompt,
            is_ai_generated=model.is_ai_generated,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _revision_to_domain(self, model: FunctionRevisionModel) -> FunctionRevision:
        return FunctionRevision(
            id=model.id,
            function_id=model.function_id,
            revision_number=model.revision_number,
            code=model.code,
            prompt=model.prompt,
            provider=model.provider,
            model=model.model,
            diff_from_previous=model.diff_from_previous,
            created_at=model.created_at,
        )
