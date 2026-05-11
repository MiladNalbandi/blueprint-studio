"""PHP Symfony code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class SymfonyGenerator(BaseGenerator):
    language = "php"
    framework = "symfony"

    def __init__(self):
        super().__init__()
        self.env.filters["php_type"] = self._php_type
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "php_symfony/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities
        for entity in ir.entities:
            content = self.render("entity.php.j2", entity=entity, ir=ir)
            path = f"src/Entity/{self._pascal_case(entity.name)}.php"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs
        for dto in ir.dtos:
            content = self.render("dto.php.j2", dto=dto, ir=ir)
            path = f"src/DTO/{self._pascal_case(dto.name)}DTO.php"
            files.append(GeneratedFile(path=path, content=content))

        # Repositories
        for repo in ir.repositories:
            content = self.render("repository.php.j2", repository=repo, ir=ir)
            entity_name = self._resolve_entity_name(repo.entity, ir)
            path = f"src/Repository/{entity_name}Repository.php"
            files.append(GeneratedFile(path=path, content=content))

        # Services
        for service in ir.services:
            content = self.render("service.php.j2", service=service, ir=ir)
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            path = f"src/Service/{name}{suffix}.php"
            files.append(GeneratedFile(path=path, content=content))

        # Controllers
        for endpoint in ir.endpoints:
            name = self._controller_name(endpoint.path)
            content = self.render("controller.php.j2", endpoint=endpoint, ir=ir, controller_name=name)
            path = f"src/Controller/{name}Controller.php"
            files.append(GeneratedFile(path=path, content=content))

        # composer.json
        content = self.render("composer.json.j2", ir=ir)
        files.append(GeneratedFile(path="composer.json", content=content))

        return files

    def _resolve_entity_name(self, entity_ref: str, ir: IR) -> str:
        for entity in ir.entities:
            if entity.id == entity_ref or entity.name == entity_ref:
                return self._pascal_case(entity.name)
        # Fallback: treat the ref itself as a name
        return self._pascal_case(entity_ref) if entity_ref else "Unknown"

    def _controller_name(self, path: str) -> str:
        parts = [p for p in path.strip("/").split("/") if p and not p.startswith("{")]
        if parts:
            return self._pascal_case(parts[-1])
        return "Default"

    @staticmethod
    def _php_type(ir_type: str) -> str:
        return {
            "integer": "int", "bigint": "int", "string": "string",
            "text": "string", "boolean": "bool", "float": "float",
            "decimal": "float", "date": "\\DateTimeInterface",
            "datetime": "\\DateTimeInterface", "json": "array", "uuid": "string",
        }.get(ir_type, "mixed")

    @staticmethod
    def _strip_prefix(value: str, prefix: str) -> str:
        if value.lower().startswith(prefix.lower()):
            return value[len(prefix):]
        return value

    @staticmethod
    def _is_write_method(method_name: str) -> bool:
        lower = method_name.lower()
        return any(lower.startswith(p) for p in ("create", "save", "update", "delete", "remove"))
