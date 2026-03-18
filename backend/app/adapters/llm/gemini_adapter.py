"""Google Gemini LLM adapter."""

from collections.abc import AsyncGenerator

from google import genai

from app.ports.interfaces import LLMProviderPort


class GeminiAdapter(LLMProviderPort):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash", temperature: float = 0.3):
        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.temperature = temperature

    async def chat(self, messages: list[dict], system: str = "") -> str:
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=contents,
            config={
                "system_instruction": system,
                "temperature": self.temperature,
                "max_output_tokens": 4096,
            },
        )
        return response.text or ""

    async def stream(self, messages: list[dict], system: str = "") -> AsyncGenerator[str, None]:
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        async for chunk in await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config={
                "system_instruction": system,
                "temperature": self.temperature,
                "max_output_tokens": 4096,
            },
        ):
            if chunk.text:
                yield chunk.text
