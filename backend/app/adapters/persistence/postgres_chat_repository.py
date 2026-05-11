"""PostgreSQL adapter for chat sessions and messages."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.persistence.models import ChatMessageModel, ChatSessionModel
from app.domain.models.project import ChatMessageRecord, ChatSession
from app.ports.interfaces import ChatRepositoryPort


class PostgresChatRepository(ChatRepositoryPort):

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(self, project_id: UUID, title: str = "New Chat") -> ChatSession:
        model = ChatSessionModel(project_id=project_id, title=title)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._session_to_domain(model, 0)

    async def list_sessions(self, project_id: UUID) -> list[ChatSession]:
        # Subquery for message counts
        count_subq = (
            select(
                ChatMessageModel.session_id,
                func.count(ChatMessageModel.id).label("msg_count"),
            )
            .group_by(ChatMessageModel.session_id)
            .subquery()
        )

        stmt = (
            select(ChatSessionModel, func.coalesce(count_subq.c.msg_count, 0).label("message_count"))
            .outerjoin(count_subq, ChatSessionModel.id == count_subq.c.session_id)
            .where(ChatSessionModel.project_id == project_id)
            .order_by(ChatSessionModel.updated_at.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [self._session_to_domain(row[0], row[1]) for row in rows]

    async def delete_session(self, session_id: UUID) -> bool:
        result = await self.session.execute(
            sa_delete(ChatSessionModel).where(ChatSessionModel.id == session_id)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def update_session_title(self, session_id: UUID, title: str) -> ChatSession | None:
        result = await self.session.execute(
            select(ChatSessionModel).where(ChatSessionModel.id == session_id)
        )
        model = result.scalar_one_or_none()
        if not model:
            return None
        model.title = title
        await self.session.commit()
        await self.session.refresh(model)
        # Get message count
        count_result = await self.session.execute(
            select(func.count(ChatMessageModel.id)).where(ChatMessageModel.session_id == session_id)
        )
        count = count_result.scalar() or 0
        return self._session_to_domain(model, count)

    async def save_message(
        self, session_id: UUID, project_id: UUID, role: str, content: str, nodes_created: dict | None = None
    ) -> ChatMessageRecord:
        msg = ChatMessageModel(
            session_id=session_id,
            project_id=project_id,
            role=role,
            content=content,
            nodes_created=nodes_created,
        )
        self.session.add(msg)

        # Bump session updated_at
        sess_result = await self.session.execute(
            select(ChatSessionModel).where(ChatSessionModel.id == session_id)
        )
        sess_model = sess_result.scalar_one_or_none()
        if sess_model:
            sess_model.updated_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(msg)
        return self._message_to_domain(msg)

    async def get_messages(self, session_id: UUID) -> list[ChatMessageRecord]:
        result = await self.session.execute(
            select(ChatMessageModel)
            .where(ChatMessageModel.session_id == session_id)
            .order_by(ChatMessageModel.created_at.asc())
        )
        return [self._message_to_domain(m) for m in result.scalars().all()]

    def _session_to_domain(self, model: ChatSessionModel, message_count: int) -> ChatSession:
        return ChatSession(
            id=model.id,
            project_id=model.project_id,
            title=model.title,
            created_at=model.created_at,
            updated_at=model.updated_at,
            message_count=message_count,
        )

    def _message_to_domain(self, model: ChatMessageModel) -> ChatMessageRecord:
        return ChatMessageRecord(
            id=model.id,
            session_id=model.session_id,
            role=model.role,
            content=model.content,
            nodes_created=model.nodes_created,
            created_at=model.created_at,
        )
