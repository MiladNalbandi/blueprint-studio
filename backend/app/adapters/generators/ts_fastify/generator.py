"""TypeScript Fastify code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class FastifyGenerator(BaseGenerator):
    language = "typescript"
    framework = "fastify"

    def __init__(self):
        super().__init__()
        self.env.filters["ts_type"] = self._ts_type
        self.env.filters["json_schema_type"] = self._json_schema_type
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "ts_fastify/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities (TypeORM-style or plain interfaces based on ORM)
        for entity in ir.entities:
            content = self.render("entity.ts.j2", entity=entity, ir=ir)
            path = f"src/entities/{self._pascal_case(entity.name)}.ts"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs
        for dto in ir.dtos:
            content = self.render("dto.ts.j2", dto=dto, ir=ir)
            path = f"src/dtos/{self._pascal_case(dto.name)}.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Repositories
        for repo in ir.repositories:
            entity_name = self._resolve_entity_name(repo.entity, ir)
            content = self.render("repository.ts.j2", repository=repo, entity_name=entity_name, ir=ir)
            path = f"src/repositories/{entity_name}Repository.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Services
        for service in ir.services:
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            content = self.render("service.ts.j2", service=service, ir=ir)
            path = f"src/services/{name}{suffix}.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Routes — group endpoints by base path to avoid duplicate files
        route_groups: dict[str, list] = {}
        for endpoint in ir.endpoints:
            route_name = self._route_name(endpoint.path)
            route_groups.setdefault(route_name, []).append(endpoint)

        for route_name, endpoints in route_groups.items():
            content = self.render("route.ts.j2", endpoints=endpoints, ir=ir, route_name=route_name)
            path = f"src/routes/{self._camel_case(route_name)}.ts"
            files.append(GeneratedFile(path=path, content=content))

        # App entry point
        content = self.render("index.ts.j2", ir=ir, route_names=list(route_groups.keys()))
        files.append(GeneratedFile(path="src/index.ts", content=content))

        # package.json
        content = self.render("package.json.j2", ir=ir)
        files.append(GeneratedFile(path="package.json", content=content))

        # tsconfig.json
        content = self.render("tsconfig.json.j2", ir=ir)
        files.append(GeneratedFile(path="tsconfig.json", content=content))

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
    def _ts_type(ir_type: str) -> str:
        return {
            "integer": "number", "bigint": "number", "int": "number",
            "string": "string", "text": "string",
            "boolean": "boolean", "bool": "boolean",
            "float": "number", "decimal": "number",
            "date": "Date", "datetime": "Date",
            "json": "Record<string, unknown>", "uuid": "string",
            "array": "unknown[]", "object": "Record<string, unknown>",
        }.get(ir_type, "unknown")

    @staticmethod
    def _json_schema_type(ir_type: str) -> str:
        return {
            "integer": "integer", "bigint": "integer", "int": "integer",
            "string": "string", "text": "string",
            "boolean": "boolean", "bool": "boolean",
            "float": "number", "decimal": "number",
            "date": "string", "datetime": "string",
            "json": "object", "uuid": "string",
            "array": "array", "object": "object",
        }.get(ir_type, "string")

    @staticmethod
    def _strip_prefix(value: str, prefix: str) -> str:
        if value.lower().startswith(prefix.lower()):
            return value[len(prefix):]
        return value

    @staticmethod
    def _is_write_method(method_name: str) -> bool:
        lower = method_name.lower()
        return any(lower.startswith(p) for p in ("create", "save", "update", "delete", "remove"))
