"""TypeScript NestJS code generator."""

import re

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class NestJSGenerator(BaseGenerator):
    language = "typescript"
    framework = "nestjs"

    def __init__(self):
        super().__init__()
        self.env.filters["ts_type"] = self._ts_type
        self.env.filters["json_schema_type"] = self._json_schema_type
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.filters["kebab_case"] = self._kebab_case
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "ts_nestjs/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities (TypeORM)
        for entity in ir.entities:
            kebab = self._kebab_case(entity.name)
            content = self.render("entity.ts.j2", entity=entity, ir=ir)
            path = f"src/{kebab}/{kebab}.entity.ts"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs (class-validator)
        for dto in ir.dtos:
            kebab = self._kebab_case(dto.name)
            content = self.render("dto.ts.j2", dto=dto, ir=ir)
            path = f"src/{kebab}/dto/create-{kebab}.dto.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Repositories
        for repo in ir.repositories:
            entity_name = self._resolve_entity_name(repo.entity, ir)
            kebab = self._kebab_case(entity_name)
            content = self.render("repository.ts.j2", repository=repo, entity_name=entity_name, ir=ir)
            path = f"src/{kebab}/{kebab}.repository.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Services
        for service in ir.services:
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            kebab = self._kebab_case(service.name)
            content = self.render("service.ts.j2", service=service, ir=ir)
            path = f"src/{kebab}/{kebab}.service.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Controllers — group endpoints by base path
        route_groups: dict[str, list] = {}
        for endpoint in ir.endpoints:
            route_name = self._route_name(endpoint.path)
            route_groups.setdefault(route_name, []).append(endpoint)

        for route_name, endpoints in route_groups.items():
            kebab = self._kebab_case(route_name)
            base_path = self._extract_base_path(endpoints)
            content = self.render(
                "controller.ts.j2",
                endpoints=endpoints,
                ir=ir,
                route_name=route_name,
                kebab=kebab,
                base_path=base_path,
            )
            path = f"src/{kebab}/{kebab}.controller.ts"
            files.append(GeneratedFile(path=path, content=content))

        # Modules — one per feature
        feature_names = self._collect_feature_names(ir, route_groups)
        for feature_name in feature_names:
            kebab = self._kebab_case(feature_name)
            has_entity = any(self._pascal_case(e.name) == feature_name for e in ir.entities)
            has_controller = any(self._kebab_case(rn) == kebab for rn in route_groups)
            has_service = any(
                self._kebab_case(s.name) == kebab
                or self._kebab_case(self._pascal_case(s.name).removesuffix("Service")) == kebab
                for s in ir.services
            )
            has_repository = any(
                self._kebab_case(self._resolve_entity_name(r.entity, ir)) == kebab for r in ir.repositories
            )
            content = self.render(
                "module.ts.j2",
                feature_name=feature_name,
                kebab=kebab,
                has_entity=has_entity,
                has_controller=has_controller,
                has_service=has_service,
                has_repository=has_repository,
                ir=ir,
            )
            path = f"src/{kebab}/{kebab}.module.ts"
            files.append(GeneratedFile(path=path, content=content))

        # App module
        content = self.render("app.module.ts.j2", feature_names=feature_names, ir=ir)
        files.append(GeneratedFile(path="src/app.module.ts", content=content))

        # Main entry point
        content = self.render("main.ts.j2", ir=ir)
        files.append(GeneratedFile(path="src/main.ts", content=content))

        # package.json
        content = self.render("package.json.j2", ir=ir)
        files.append(GeneratedFile(path="package.json", content=content))

        # tsconfig.json
        content = self.render("tsconfig.json.j2", ir=ir)
        files.append(GeneratedFile(path="tsconfig.json", content=content))

        return files

    def _collect_feature_names(self, ir: IR, route_groups: dict[str, list]) -> list[str]:
        """Collect unique feature names from entities, services, and route groups."""
        seen: set[str] = set()
        names: list[str] = []
        # Entities first
        for entity in ir.entities:
            pc = self._pascal_case(entity.name)
            if pc not in seen:
                seen.add(pc)
                names.append(pc)
        # Route groups (controllers)
        for route_name in route_groups:
            pc = self._pascal_case(route_name)
            if pc not in seen:
                seen.add(pc)
                names.append(pc)
        return names

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

    def _extract_base_path(self, endpoints: list) -> str:
        """Extract the common base path from a group of endpoints."""
        if not endpoints:
            return "/"
        parts_list = []
        for ep in endpoints:
            parts = [p for p in ep.path.strip("/").split("/") if p and not p.startswith("{") and not p.startswith(":")]
            parts_list.append(parts)
        if not parts_list or not parts_list[0]:
            return "/"
        # Use the first non-param segment as the base path
        return parts_list[0][0]

    @staticmethod
    def _kebab_case(value: str) -> str:
        """Convert PascalCase/camelCase/snake_case to kebab-case."""
        # Insert hyphens before uppercase letters (camelCase/PascalCase boundaries)
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1-\2", value)
        s2 = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s1)
        # Replace underscores and spaces with hyphens
        return s2.replace("_", "-").replace(" ", "-").lower()

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
