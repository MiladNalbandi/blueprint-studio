"""Pydantic request/response schemas for the API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Project ────────────────────────────────────────────

class ProjectConfigSchema(BaseModel):
    language: str
    framework: str
    database: str | None = None
    orm: str | None = None
    architecture: str = "mvc"


class ProjectCreate(BaseModel):
    name: str = "Untitled Project"
    config: ProjectConfigSchema


class ProjectUpdate(BaseModel):
    name: str | None = None
    config: ProjectConfigSchema | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    config: ProjectConfigSchema
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Flow ────────────────────────────────────────────────

class FlowNodeSchema(BaseModel):
    id: str
    type: str
    label: str = ""
    x: float = 0
    y: float = 0
    config: dict = Field(default_factory=dict)


class FlowEdgeSchema(BaseModel):
    id: str
    source: str
    target: str


class FlowGraphSchema(BaseModel):
    nodes: list[FlowNodeSchema] = Field(default_factory=list)
    edges: list[FlowEdgeSchema] = Field(default_factory=list)
    viewport: dict = Field(default_factory=lambda: {"x": 0, "y": 0, "zoom": 1})


class FlowSaveRequest(BaseModel):
    flow: FlowGraphSchema


# ─── LLM Config ──────────────────────────────────────────

class LLMConfigCreate(BaseModel):
    provider: str  # claude, openai, gemini
    model: str
    api_key: str
    base_url: str | None = None
    temperature: float = 0.3


class LLMConfigResponse(BaseModel):
    id: UUID
    provider: str
    model: str
    base_url: str | None
    temperature: float
    has_api_key: bool  # never expose the actual key

    model_config = {"from_attributes": True}


# ─── Generation ──────────────────────────────────────────

class GenerateRequest(BaseModel):
    provider: str = "claude"  # which LLM to use for generation


class GenerationResponse(BaseModel):
    id: UUID
    status: str
    provider_used: str
    created_at: datetime
    error: str | None = None

    model_config = {"from_attributes": True}


# ─── Chat ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    nodes_created: dict | None = None
