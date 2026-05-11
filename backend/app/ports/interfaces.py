"""Ports — abstract interfaces that adapters must implement."""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from uuid import UUID

from app.domain.models.ir import IR
from app.domain.models.project import ChatMessageRecord, ChatSession, FunctionDefinition, FunctionRevision, GeneratedFile, GenerationResult, LLMProviderConfig, Project


# ─── LLM Provider Port ──────────────────────────────────

class LLMProviderPort(ABC):
    """Interface for any LLM provider (Claude, GPT, Gemini, etc.)."""

    @abstractmethod
    async def chat(self, messages: list[dict], system: str = "", max_tokens: int | None = None) -> str:
        """Send messages and get a complete response."""
        ...

    @abstractmethod
    async def stream(self, messages: list[dict], system: str = "") -> AsyncGenerator[str, None]:
        """Stream response tokens."""
        ...


# ─── Code Generator Port ────────────────────────────────

class CodeGeneratorPort(ABC):
    """Interface for language/framework-specific code generators."""

    @abstractmethod
    def supports(self, language: str, framework: str) -> bool:
        """Check if this generator handles the given stack."""
        ...

    @abstractmethod
    def generate(self, ir: IR) -> list[GeneratedFile]:
        """Generate code files from the IR."""
        ...


# ─── Project Repository Port ────────────────────────────

class ProjectRepositoryPort(ABC):
    """Interface for project persistence."""

    @abstractmethod
    async def save(self, project: Project) -> Project:
        ...

    @abstractmethod
    async def get(self, project_id: UUID) -> Project | None:
        ...

    @abstractmethod
    async def list_all(self) -> list[Project]:
        ...

    @abstractmethod
    async def delete(self, project_id: UUID) -> bool:
        ...

    @abstractmethod
    async def save_llm_config(self, config: LLMProviderConfig) -> LLMProviderConfig:
        ...

    @abstractmethod
    async def get_llm_configs(self, project_id: UUID) -> list[LLMProviderConfig]:
        ...

    @abstractmethod
    async def save_generation(self, result: GenerationResult) -> GenerationResult:
        ...


# ─── File Exporter Port ─────────────────────────────────

class FileExporterPort(ABC):
    """Interface for packaging generated files."""

    @abstractmethod
    def export_zip(self, files: list[GeneratedFile], project_name: str) -> bytes:
        """Package files into a downloadable zip."""
        ...


# ─── Function Repository Port ─────────────────────────

class FunctionRepositoryPort(ABC):
    """Interface for function definition + revision persistence."""

    @abstractmethod
    async def save_function(self, func: FunctionDefinition) -> FunctionDefinition:
        ...

    @abstractmethod
    async def get_function(self, function_id: UUID) -> FunctionDefinition | None:
        ...

    @abstractmethod
    async def list_functions(self, project_id: UUID, node_id: str | None = None) -> list[FunctionDefinition]:
        ...

    @abstractmethod
    async def update_function(self, function_id: UUID, **kwargs) -> FunctionDefinition | None:
        ...

    @abstractmethod
    async def delete_function(self, function_id: UUID) -> bool:
        ...

    @abstractmethod
    async def save_revision(self, revision: FunctionRevision) -> FunctionRevision:
        ...

    @abstractmethod
    async def get_revisions(self, function_id: UUID) -> list[FunctionRevision]:
        ...

    @abstractmethod
    async def get_revision(self, revision_id: UUID) -> FunctionRevision | None:
        ...

    @abstractmethod
    async def get_functions_by_project(self, project_id: UUID) -> list[FunctionDefinition]:
        ...


# ─── Chat Repository Port ─────────────────────────────

class ChatRepositoryPort(ABC):
    """Interface for chat session + message persistence."""

    @abstractmethod
    async def create_session(self, project_id: UUID, title: str = "New Chat") -> ChatSession:
        ...

    @abstractmethod
    async def list_sessions(self, project_id: UUID) -> list[ChatSession]:
        ...

    @abstractmethod
    async def delete_session(self, session_id: UUID) -> bool:
        ...

    @abstractmethod
    async def update_session_title(self, session_id: UUID, title: str) -> ChatSession | None:
        ...

    @abstractmethod
    async def save_message(self, session_id: UUID, project_id: UUID, role: str, content: str, nodes_created: dict | None = None) -> ChatMessageRecord:
        ...

    @abstractmethod
    async def get_messages(self, session_id: UUID) -> list[ChatMessageRecord]:
        ...
