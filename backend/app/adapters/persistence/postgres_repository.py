"""PostgreSQL implementation of ProjectRepositoryPort."""

from uuid import UUID

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.persistence.models import ProjectModel, LLMConfigModel, GenerationModel
from app.domain.models.project import (
    FlowGraph, FlowNode, FlowEdge, GeneratedFile, GenerationResult,
    Language, Architecture, LLMProviderConfig, Project, ProjectConfig,
)
from app.ports.interfaces import ProjectRepositoryPort


class PostgresProjectRepository(ProjectRepositoryPort):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, project: Project) -> Project:
        existing = await self.session.get(ProjectModel, project.id)
        if existing:
            existing.name = project.name
            existing.language = project.config.language.value
            existing.framework = project.config.framework
            existing.database = project.config.database
            existing.orm = project.config.orm
            existing.architecture = project.config.architecture.value
            existing.flows = self._flow_to_dict(project.flow)
        else:
            model = ProjectModel(
                id=project.id,
                name=project.name,
                language=project.config.language.value,
                framework=project.config.framework,
                database=project.config.database,
                orm=project.config.orm,
                architecture=project.config.architecture.value,
                flows=self._flow_to_dict(project.flow),
            )
            self.session.add(model)
        await self.session.commit()
        return project

    async def get(self, project_id: UUID) -> Project | None:
        model = await self.session.get(ProjectModel, project_id)
        if not model:
            return None
        return self._to_domain(model)

    async def list_all(self) -> list[Project]:
        result = await self.session.execute(select(ProjectModel).order_by(ProjectModel.updated_at.desc()))
        return [self._to_domain(m) for m in result.scalars().all()]

    async def delete(self, project_id: UUID) -> bool:
        result = await self.session.execute(sa_delete(ProjectModel).where(ProjectModel.id == project_id))
        await self.session.commit()
        return result.rowcount > 0

    async def save_llm_config(self, config: LLMProviderConfig) -> LLMProviderConfig:
        model = LLMConfigModel(
            id=config.id,
            project_id=config.project_id,
            provider=config.provider,
            model=config.model,
            api_key_encrypted=config.api_key_encrypted,
            base_url=config.base_url,
            temperature=config.temperature,
        )
        self.session.add(model)
        await self.session.commit()
        return config

    async def get_llm_configs(self, project_id: UUID) -> list[LLMProviderConfig]:
        result = await self.session.execute(
            select(LLMConfigModel).where(LLMConfigModel.project_id == project_id)
        )
        return [
            LLMProviderConfig(
                id=m.id, project_id=m.project_id, provider=m.provider,
                model=m.model, api_key_encrypted=m.api_key_encrypted,
                base_url=m.base_url, temperature=m.temperature,
            )
            for m in result.scalars().all()
        ]

    async def save_generation(self, result: GenerationResult) -> GenerationResult:
        model = GenerationModel(
            id=result.id,
            project_id=result.project_id,
            provider_used=result.provider_used,
            ir_snapshot=result.ir_snapshot,
            status=result.status,
            error=result.error,
        )
        self.session.add(model)
        await self.session.commit()
        return result

    # ─── Mappers ──────────────────────────────────────────

    def _to_domain(self, model: ProjectModel) -> Project:
        return Project(
            id=model.id,
            name=model.name,
            config=ProjectConfig(
                language=Language(model.language),
                framework=model.framework,
                database=model.database,
                orm=model.orm,
                architecture=Architecture(model.architecture),
            ),
            flow=self._dict_to_flow(model.flows or {}),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _flow_to_dict(self, flow: FlowGraph) -> dict:
        return {
            "nodes": [
                {"id": n.id, "type": n.type.value if hasattr(n.type, "value") else n.type,
                 "label": n.label, "x": n.x, "y": n.y, "config": n.config}
                for n in flow.nodes
            ],
            "edges": [
                {"id": e.id, "source": e.source, "target": e.target}
                for e in flow.edges
            ],
            "viewport": flow.viewport,
        }

    def _dict_to_flow(self, data: dict) -> FlowGraph:
        nodes = [
            FlowNode(id=n["id"], type=n["type"], label=n.get("label", ""),
                     x=n.get("x", 0), y=n.get("y", 0), config=n.get("config", {}))
            for n in data.get("nodes", [])
        ]
        edges = [
            FlowEdge(id=e["id"], source=e["source"], target=e["target"])
            for e in data.get("edges", [])
        ]
        return FlowGraph(nodes=nodes, edges=edges, viewport=data.get("viewport", {}))
