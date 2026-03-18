"""Factory to create the right LLM adapter from config."""

from app.adapters.llm.claude_adapter import ClaudeAdapter
from app.adapters.llm.openai_adapter import OpenAIAdapter
from app.adapters.llm.gemini_adapter import GeminiAdapter
from app.ports.interfaces import LLMProviderPort


def create_llm_provider(provider: str, api_key: str, model: str, temperature: float = 0.3) -> LLMProviderPort:
    match provider:
        case "claude":
            return ClaudeAdapter(api_key=api_key, model=model, temperature=temperature)
        case "openai":
            return OpenAIAdapter(api_key=api_key, model=model, temperature=temperature)
        case "gemini":
            return GeminiAdapter(api_key=api_key, model=model, temperature=temperature)
        case _:
            raise ValueError(f"Unknown LLM provider: {provider}")
