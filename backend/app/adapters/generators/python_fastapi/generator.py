"""Python FastAPI code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class FastAPIGenerator(BaseGenerator):
    language = "python"
    framework = "fastapi"

    def __init__(self):
        super().__init__()
        self.env.filters["py_type"] = self._py_type
        self.env.filters["sa_type"] = self._sa_type
        self.env.filters["sa_import"] = self._sa_import
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "python_fastapi/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities
        for entity in ir.entities:
            content = self.render("entity.py.j2", entity=entity, ir=ir)
            path = f"app/models/{self._snake_case(entity.name)}.py"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs
        for dto in ir.dtos:
            content = self.render("dto.py.j2", dto=dto, ir=ir)
            path = f"app/schemas/{self._snake_case(dto.name)}.py"
            files.append(GeneratedFile(path=path, content=content))

        # Repositories
        for repo in ir.repositories:
            entity_name = self._resolve_entity_name(repo.entity, ir)
            content = self.render("repository.py.j2", repository=repo, entity_name=entity_name, ir=ir)
            path = f"app/repositories/{self._snake_case(entity_name)}_repository.py"
            files.append(GeneratedFile(path=path, content=content))

        # Services
        for service in ir.services:
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            content = self.render("service.py.j2", service=service, ir=ir)
            path = f"app/services/{self._snake_case(name)}{('_service' if suffix else '')}.py"
            files.append(GeneratedFile(path=path, content=content))

        # Routes — group endpoints by base path to avoid duplicate files
        route_groups: dict[str, list] = {}
        for endpoint in ir.endpoints:
            route_name = self._route_name(endpoint.path)
            route_groups.setdefault(route_name, []).append(endpoint)

        for route_name, endpoints in route_groups.items():
            content = self.render("route.py.j2", endpoints=endpoints, ir=ir, route_name=route_name)
            path = f"app/routes/{self._snake_case(route_name)}.py"
            files.append(GeneratedFile(path=path, content=content))

        # Main entry point
        content = self.render("main.py.j2", ir=ir, route_names=list(route_groups.keys()))
        files.append(GeneratedFile(path="app/main.py", content=content))

        # Dependency manifest — choose template based on package manager
        pm = (ir.package_manager or "pip").lower()
        if pm == "poetry":
            content = self.render("pyproject.toml.j2", ir=ir)
            files.append(GeneratedFile(path="pyproject.toml", content=content))
        elif pm == "pipenv":
            content = self.render("Pipfile.j2", ir=ir)
            files.append(GeneratedFile(path="Pipfile", content=content))
        else:
            content = self.render("requirements.txt.j2", ir=ir)
            files.append(GeneratedFile(path="requirements.txt", content=content))

        return files

    def _resolve_entity_name(self, entity_ref: str, ir: IR) -> str:
        for entity in ir.entities:
            if entity.id == entity_ref or entity.name == entity_ref:
                return self._pascal_case(entity.name)
        return self._pascal_case(entity_ref) if entity_ref else "Unknown"

    def _route_name(self, path: str) -> str:
        parts = [p for p in path.strip("/").split("/") if p and not p.startswith("{") and not p.startswith(":")]
        if parts:
            return self._pascal_case(parts[-1])
        return "Default"

    @staticmethod
    def _py_type(ir_type: str) -> str:
        return {
            "integer": "int", "bigint": "int", "int": "int",
            "string": "str", "text": "str",
            "boolean": "bool", "bool": "bool",
            "float": "float", "decimal": "float",
            "date": "date", "datetime": "datetime",
            "json": "dict", "uuid": "UUID",
            "array": "list", "object": "dict",
        }.get(ir_type, "str")

    @staticmethod
    def _sa_type(ir_type: str) -> str:
        return {
            "integer": "Integer", "bigint": "BigInteger", "int": "Integer",
            "string": "String(255)", "text": "Text",
            "boolean": "Boolean", "bool": "Boolean",
            "float": "Float", "decimal": "Numeric",
            "date": "Date", "datetime": "DateTime",
            "json": "JSON", "uuid": "Uuid",
            "array": "JSON", "object": "JSON",
        }.get(ir_type, "String(255)")

    @staticmethod
    def _sa_import(sa_type: str) -> str:
        """Strip parenthesized args for import statements: 'String(255)' → 'String'."""
        idx = sa_type.find("(")
        return sa_type[:idx] if idx != -1 else sa_type

    @staticmethod
    def _strip_prefix(value: str, prefix: str) -> str:
        if value.lower().startswith(prefix.lower()):
            return value[len(prefix):]
        return value

    @staticmethod
    def _is_write_method(method_name: str) -> bool:
        lower = method_name.lower()
        return any(lower.startswith(p) for p in ("create", "save", "update", "delete", "remove"))
