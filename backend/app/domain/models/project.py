"""Domain models — pure data structures, no framework dependencies."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4


# ─── Enums ──────────────────────────────────────────────

class Language(str, Enum):
    PHP = "php"
    TYPESCRIPT = "typescript"
    GO = "go"
    PYTHON = "python"
    JAVA = "java"
    RUST = "rust"


class Architecture(str, Enum):
    DDD = "ddd"
    MVC = "mvc"
    HEXAGONAL = "hexagonal"
    CLEAN = "clean"
    CQRS = "cqrs"
    MICROSERVICE = "microservice"


class NodeType(str, Enum):
    ENDPOINT = "endpoint"
    DTO = "dto"
    VALIDATOR = "validator"
    LOGIC = "logic"
    ENTITY = "entity"
    RESPONSE = "response"
    MIDDLEWARE = "middleware"
    SERVICE = "service"
    REPOSITORY = "repository"
    EVENT = "event"


class GenerationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── Flow Graph ─────────────────────────────────────────

@dataclass
class NodeConfig:
    """Flexible config dict for any node type."""
    data: dict = field(default_factory=dict)


@dataclass
class FlowNode:
    id: str
    type: NodeType
    label: str
    x: float
    y: float
    config: dict = field(default_factory=dict)


@dataclass
class FlowEdge:
    id: str
    source: str  # node id
    target: str  # node id


@dataclass
class FlowGraph:
    nodes: list[FlowNode] = field(default_factory=list)
    edges: list[FlowEdge] = field(default_factory=list)
    viewport: dict = field(default_factory=lambda: {"x": 0, "y": 0, "zoom": 1})


# ─── Project ────────────────────────────────────────────

@dataclass
class ProjectConfig:
    language: Language
    framework: str
    database: str | None = None
    orm: str | None = None
    architecture: Architecture = Architecture.MVC


@dataclass
class Project:
    id: UUID = field(default_factory=uuid4)
    name: str = "Untitled Project"
    config: ProjectConfig = field(default_factory=lambda: ProjectConfig(
        language=Language.PHP, framework="Symfony"
    ))
    flow: FlowGraph = field(default_factory=FlowGraph)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ─── LLM Config ─────────────────────────────────────────

@dataclass
class LLMProviderConfig:
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    provider: str = "claude"  # claude, openai, gemini
    model: str = "claude-sonnet-4-20250514"
    api_key_encrypted: str = ""
    base_url: str | None = None
    temperature: float = 0.3


# ─── Generation ─────────────────────────────────────────

@dataclass
class GeneratedFile:
    path: str       # e.g. "src/Controller/UserController.php"
    content: str    # the generated code


@dataclass
class GenerationResult:
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    provider_used: str = ""
    status: GenerationStatus = GenerationStatus.PENDING
    files: list[GeneratedFile] = field(default_factory=list)
    ir_snapshot: dict = field(default_factory=dict)
    error: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
