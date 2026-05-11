"""OpenAI GPT LLM adapter."""

from collections.abc import AsyncGenerator

import openai

from app.ports.interfaces import LLMProviderPort


class OpenAIAdapter(LLMProviderPort):
    def __init__(self, api_key: str, model: str = "gpt-4o", temperature: float = 0.3):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model
        self.temperature = temperature

    async def chat(self, messages: list[dict], system: str = "", max_tokens: int | None = None) -> str:
        msgs = []
        if system:
            msgs.append({"role": "system", "content": system})
        msgs.extend(messages)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            temperature=self.temperature,
            max_tokens=max_tokens or 4096,
        )
        return response.choices[0].message.content or ""

    async def stream(self, messages: list[dict], system: str = "") -> AsyncGenerator[str, None]:
        msgs = []
        if system:
            msgs.append({"role": "system", "content": system})
        msgs.extend(messages)

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            temperature=self.temperature,
            max_tokens=4096,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
