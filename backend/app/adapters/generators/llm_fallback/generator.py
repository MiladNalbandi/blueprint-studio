"""LLM-based fallback code generator for unsupported language/framework combos."""

import json
import logging
import re

from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile
from app.ports.interfaces import LLMProviderPort

logger = logging.getLogger(__name__)


class LLMFallbackGenerator:
    """Generates code for any language/framework by asking an LLM."""

    async def generate(self, ir: IR, llm: LLMProviderPort) -> list[GeneratedFile]:
        system = self._build_system_prompt(ir)
        user_msg = self._build_user_message(ir)
        raw = await llm.chat(
            [{"role": "user", "content": user_msg}],
            system=system,
            max_tokens=16384,
        )
        return self._parse_response(raw)

    def _build_system_prompt(self, ir: IR) -> str:
        return (
            "You are a senior backend code generator. "
            "Generate production-quality code for the following stack:\n"
            f"- Language: {ir.language}\n"
            f"- Framework: {ir.framework}\n"
            f"- Database: {ir.database or 'none specified'}\n"
            f"- ORM: {ir.orm or 'none specified'}\n"
            f"- Architecture: {ir.architecture}\n\n"
            "Output ONLY a JSON array of file objects. Each object has:\n"
            '  - "path": relative file path (e.g. "src/main/java/com/app/App.java")\n'
            '  - "content": the full file content as a string\n\n'
            "Rules:\n"
            "1. Write idiomatic, well-structured code with proper imports\n"
            "2. Include the project manifest file (pom.xml, Cargo.toml, go.mod, etc.)\n"
            "3. Follow the specified architecture pattern conventions\n"
            "4. Output ONLY valid JSON — no markdown fences, no explanation text\n"
            "5. Every file must be complete and runnable (no placeholders or TODOs)\n"
        )

    def _build_user_message(self, ir: IR) -> str:
        return (
            "Generate code files for this project architecture. "
            "Here is the Intermediate Representation (IR) of the flow graph:\n\n"
            + json.dumps(ir.to_dict(), indent=2, default=str)
        )

    def _parse_response(self, raw: str) -> list[GeneratedFile]:
        files_data = self._extract_json(raw)
        if not isinstance(files_data, list):
            raise ValueError("LLM response is not a JSON array")

        files = []
        for entry in files_data:
            if not isinstance(entry, dict):
                continue
            path = entry.get("path")
            content = entry.get("content")
            if isinstance(path, str) and isinstance(content, str):
                files.append(GeneratedFile(path=path, content=content))

        return files

    def _extract_json(self, raw: str) -> list:
        """Try direct parse, then extract from markdown fences."""
        text = raw.strip()

        # Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Extract from ```json ... ``` or ``` ... ``` fences
        match = re.search(r"```(?:json)?\s*\n(.*?)```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass

        raise ValueError("Could not parse LLM output as JSON")
