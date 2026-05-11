"""Base generator — shared Jinja2 rendering logic for all stack generators."""

import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile
from app.ports.interfaces import CodeGeneratorPort


class BaseGenerator(CodeGeneratorPort):
    """Subclass this for each language/framework combination."""

    language: str = ""
    framework: str = ""

    def __init__(self):
        template_dir = Path(__file__).parent.parent / self._template_subdir()
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape([]),
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True,
        )
        # Register custom filters
        self.env.filters["pascal_case"] = self._pascal_case
        self.env.filters["snake_case"] = self._snake_case
        self.env.filters["camel_case"] = self._camel_case
        # Register custom tests
        self.env.tests["matching"] = self._test_matching

    def supports(self, language: str, framework: str) -> bool:
        return self.language == language and self.framework.lower() == framework.lower()

    def generate(self, ir: IR) -> list[GeneratedFile]:
        raise NotImplementedError("Subclasses must implement generate()")

    def _template_subdir(self) -> str:
        """Override to return path like 'php_symfony/templates'."""
        raise NotImplementedError

    def render(self, template_name: str, **context) -> str:
        template = self.env.get_template(template_name)
        return template.render(**context)

    # ─── Naming Filters ──────────────────────────────────

    @staticmethod
    def _pascal_case(value: str) -> str:
        # Split on separators AND camelCase boundaries so "LabelRequest" stays intact
        spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
        words = spaced.replace("_", " ").replace("-", " ").split()
        return "".join(word.capitalize() for word in words)

    @staticmethod
    def _snake_case(value: str) -> str:
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", value)
        return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()

    @staticmethod
    def _camel_case(value: str) -> str:
        spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
        words = spaced.replace("_", " ").replace("-", " ").split()
        if not words:
            return value
        return words[0].lower() + "".join(w.capitalize() for w in words[1:])

    @staticmethod
    def _test_matching(value: str, pattern: str) -> bool:
        """Jinja2 test: `value is matching('pattern')` — regex search (case-insensitive)."""
        return bool(re.search(pattern, value, re.IGNORECASE))
