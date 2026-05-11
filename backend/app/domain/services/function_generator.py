"""AI-powered function implementation generator."""

import difflib
from dataclasses import dataclass

from app.domain.models.project import FunctionDefinition, ProjectConfig, FlowNode
from app.ports.interfaces import LLMProviderPort


@dataclass
class GenerationResult:
    code: str
    diff: str | None


SYSTEM_PROMPT = """You are a code generation AI for FlowForge. You write clean, production-quality function implementations.

PROJECT CONTEXT:
- Language: {language}
- Framework: {framework}
- Database: {database}
- ORM: {orm}
- Architecture: {architecture}

FUNCTION SIGNATURE:
- Name: {func_name}
- Parameters: {params}
- Return type: {return_type}
- Description: {description}

PARENT NODE: {node_info}

CONNECTED NODES: {connected_nodes}

RULES:
1. Return ONLY the function body code — no function signature, no wrapping, no markdown fences
2. Write idiomatic {language} code following {framework} conventions
3. Use proper error handling for the target language
4. If the function interacts with a repository, use dependency injection patterns
5. Keep the implementation focused and clean"""


class FunctionGeneratorService:
    """Generates function implementations via LLM."""

    def _summarize_node(self, node: FlowNode) -> str:
        """Summarize a node's type, label, and config for LLM context."""
        node_type = node.type.value if hasattr(node.type, 'value') else node.type
        parts = [f"- Type: {node_type}, Label: '{node.label}'"]
        if node.config:
            # Include key config details
            cfg_items = []
            for k, v in node.config.items():
                if isinstance(v, (list, dict)) and len(str(v)) > 200:
                    cfg_items.append(f"{k}: [{len(v)} items]" if isinstance(v, list) else f"{k}: {{...}}")
                else:
                    cfg_items.append(f"{k}: {v}")
            if cfg_items:
                parts.append(f"  Config: {', '.join(cfg_items)}")
        return "\n".join(parts)

    def build_prompt(
        self,
        func: FunctionDefinition,
        config: ProjectConfig,
        node: FlowNode | None = None,
        connected_nodes: list[FlowNode] | None = None,
        referenced_nodes: list[FlowNode] | None = None,
    ) -> str:
        params_str = ", ".join(
            f"{p.name}: {p.type}" + (f" = {p.default_value}" if p.default_value else "")
            for p in func.params
        ) or "none"

        node_type = node.type.value if hasattr(node.type, 'value') else node.type
        node_info = f"{node_type} '{node.label}'" if node else "unknown"

        connected_str = ", ".join(
            f"{n.type.value if hasattr(n.type, 'value') else n.type} '{n.label}'" for n in (connected_nodes or [])
        ) or "none"

        prompt = SYSTEM_PROMPT.format(
            language=config.language.value,
            framework=config.framework,
            database=config.database or "none",
            orm=config.orm or "none",
            architecture=config.architecture.value,
            func_name=func.name,
            params=params_str,
            return_type=func.return_type,
            description=func.description or "No description provided",
            node_info=node_info,
            connected_nodes=connected_str,
        )

        if referenced_nodes:
            ref_section = "\n\nREFERENCED NODES (explicitly mentioned by user):\n"
            ref_section += "\n".join(self._summarize_node(n) for n in referenced_nodes)
            ref_section += "\n\nUse the referenced nodes' config details to inform your implementation."
            prompt += ref_section

        return prompt

    async def generate(
        self,
        func: FunctionDefinition,
        prompt: str,
        config: ProjectConfig,
        llm: LLMProviderPort,
        node: FlowNode | None = None,
        connected_nodes: list[FlowNode] | None = None,
        referenced_nodes: list[FlowNode] | None = None,
    ) -> GenerationResult:
        system = self.build_prompt(func, config, node, connected_nodes, referenced_nodes)

        messages = [{"role": "user", "content": prompt}]
        if func.current_code:
            messages.insert(0, {
                "role": "user",
                "content": f"Current implementation:\n```\n{func.current_code}\n```",
            })
            messages.insert(1, {
                "role": "assistant",
                "content": "I see the current implementation. I'll improve it based on your new instructions.",
            })

        code = await llm.chat(messages, system=system)

        # Strip markdown fences if LLM wraps the code
        code = self._strip_fences(code)

        # Compute diff
        diff = self._compute_diff(func.current_code, code, func.name)

        return GenerationResult(code=code, diff=diff)

    def _strip_fences(self, code: str) -> str:
        """Remove markdown code fences if present."""
        code = code.strip()
        if code.startswith("```"):
            lines = code.split("\n")
            # Remove first line (```lang) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            code = "\n".join(lines)
        return code.strip()

    def _compute_diff(self, old_code: str, new_code: str, func_name: str) -> str | None:
        if not old_code:
            return None
        old_lines = old_code.splitlines(keepends=True)
        new_lines = new_code.splitlines(keepends=True)
        diff = difflib.unified_diff(
            old_lines, new_lines,
            fromfile=f"{func_name} (previous)",
            tofile=f"{func_name} (current)",
        )
        diff_str = "".join(diff)
        return diff_str if diff_str else None
