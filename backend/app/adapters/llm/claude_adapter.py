"""Claude (Anthropic) LLM adapter."""

from collections.abc import AsyncGenerator

import anthropic

from app.ports.interfaces import LLMProviderPort


class ClaudeAdapter(LLMProviderPort):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514", temperature: float = 0.3):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model
        self.temperature = temperature

    async def chat(self, messages: list[dict], system: str = "") -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            temperature=self.temperature,
            system=system or "You are FlowForge AI, a code architecture assistant.",
            messages=messages,
        )
        return response.content[0].text

    async def stream(self, messages: list[dict], system: str = "") -> AsyncGenerator[str, None]:
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            temperature=self.temperature,
            system=system or "You are FlowForge AI, a code architecture assistant.",
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text
