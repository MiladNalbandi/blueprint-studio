"""SQLAlchemy ORM models for PostgreSQL."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.adapters.persistence.database import Base
from app.domain.models.project import GenerationStatus


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, default="Untitled Project")
    language = Column(String(50), nullable=False)
    framework = Column(String(100), nullable=False)
    database = Column(String(50), nullable=True)
    orm = Column(String(100), nullable=True)
    architecture = Column(String(50), nullable=False, default="mvc")
    flows = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    llm_configs = relationship("LLMConfigModel", back_populates="project", cascade="all, delete-orphan")
    generations = relationship("GenerationModel", back_populates="project", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessageModel", back_populates="project", cascade="all, delete-orphan")


class LLMConfigModel(Base):
    __tablename__ = "llm_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # claude, openai, gemini
    model = Column(String(100), nullable=False)
    api_key_encrypted = Column(Text, nullable=False, default="")
    base_url = Column(String(500), nullable=True)
    temperature = Column(Float, nullable=False, default=0.3)

    project = relationship("ProjectModel", back_populates="llm_configs")


class GenerationModel(Base):
    __tablename__ = "generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    provider_used = Column(String(50), nullable=False)
    ir_snapshot = Column(JSONB, nullable=False, default=dict)
    output_path = Column(String(500), nullable=True)
    status = Column(Enum(GenerationStatus), nullable=False, default=GenerationStatus.PENDING)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectModel", back_populates="generations")


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    nodes_created = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectModel", back_populates="chat_messages")
