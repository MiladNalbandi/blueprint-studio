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
    package_manager: str | None = None


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
    referenced_node_ids: list[str] | None = None
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    nodes_created: dict | None = None
    session_id: str | None = None


class ChatSessionCreate(BaseModel):
    title: str = "New Chat"


class ChatSessionUpdate(BaseModel):
    title: str


class ChatSessionResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    nodes_created: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Functions ──────────────────────────────────────────

class FunctionParamSchema(BaseModel):
    name: str
    type: str = "string"
    default_value: str | None = None


class FunctionCreate(BaseModel):
    node_id: str
    name: str
    description: str = ""
    params: list[FunctionParamSchema] = Field(default_factory=list)
    return_type: str = "void"
    current_code: str | None = None
    current_prompt: str | None = None
    is_ai_generated: bool = False


class FunctionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    params: list[FunctionParamSchema] | None = None
    return_type: str | None = None
    current_code: str | None = None


class FunctionGenerateRequest(BaseModel):
    prompt: str
    provider: str | None = None  # override project default
    referenced_node_ids: list[str] | None = None


class FunctionRevisionResponse(BaseModel):
    id: UUID
    function_id: UUID
    revision_number: int
    code: str
    prompt: str
    provider: str
    model: str
    diff_from_previous: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FunctionResponse(BaseModel):
    id: UUID
    project_id: UUID
    node_id: str
    name: str
    description: str
    params: list[FunctionParamSchema]
    return_type: str
    current_code: str
    current_prompt: str
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FunctionGenerateResponse(BaseModel):
    function: FunctionResponse
    revision: FunctionRevisionResponse
