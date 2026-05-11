"""Go Gin code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class GoGinGenerator(BaseGenerator):
    language = "go"
    framework = "gin"

    def __init__(self):
        super().__init__()
        self.env.filters["go_type"] = self._go_type
        self.env.filters["gorm_tag"] = self._gorm_tag
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "go_gin/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities → internal/models/{snake}.go
        for entity in ir.entities:
            content = self.render("entity.go.j2", entity=entity, ir=ir)
            path = f"internal/models/{self._snake_case(entity.name)}.go"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs → internal/dto/{snake}.go
        for dto in ir.dtos:
            entity_name = self._pascal_case(dto.name)
            content = self.render("dto.go.j2", dto=dto, entity_name=entity_name, ir=ir)
            path = f"internal/dto/{self._snake_case(dto.name)}.go"
            files.append(GeneratedFile(path=path, content=content))

        # Repositories → internal/repository/{snake}_repository.go
        for repo in ir.repositories:
            entity_name = self._resolve_entity_name(repo.entity, ir)
            content = self.render("repository.go.j2", repository=repo, entity_name=entity_name, ir=ir)
            path = f"internal/repository/{self._snake_case(entity_name)}_repository.go"
            files.append(GeneratedFile(path=path, content=content))

        # Services → internal/service/{snake}_service.go
        for service in ir.services:
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            entity_name = self._resolve_entity_name(service.repository, ir) if service.repository else ""
            content = self.render(
                "service.go.j2", service=service, name=name + suffix,
                entity_name=entity_name, ir=ir,
            )
            path = f"internal/service/{self._snake_case(name)}_service.go"
            files.append(GeneratedFile(path=path, content=content))

        # Handlers — group endpoints by base path to avoid duplicate files
        route_groups: dict[str, list] = {}
        for endpoint in ir.endpoints:
            route_name = self._route_name(endpoint.path)
            route_groups.setdefault(route_name, []).append(endpoint)

        for route_name, endpoints in route_groups.items():
            handler_name = self._pascal_case(route_name)
            # Collect unique service names for this handler group
            service_names: list[str] = []
            for ep in endpoints:
                svc = self._pascal_case(ep.service_name) if ep.service_name else ""
                if svc and not svc.endswith("Service"):
                    svc = svc + "Service"
                if svc and svc not in service_names:
                    service_names.append(svc)
            service_name = service_names[0] if service_names else ""
            content = self.render(
                "handler.go.j2", endpoints=endpoints, ir=ir,
                handler_name=handler_name, service_name=service_name,
            )
            path = f"internal/handler/{self._snake_case(route_name)}_handler.go"
            files.append(GeneratedFile(path=path, content=content))

        # Router → internal/router/router.go
        content = self.render(
            "router.go.j2", ir=ir, route_groups=route_groups,
        )
        files.append(GeneratedFile(path="internal/router/router.go", content=content))

        # Main → cmd/server/main.go
        content = self.render("main.go.j2", ir=ir)
        files.append(GeneratedFile(path="cmd/server/main.go", content=content))

        # go.mod
        content = self.render("go.mod.j2", ir=ir)
        files.append(GeneratedFile(path="go.mod", content=content))

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
    def _go_type(ir_type: str) -> str:
        return {
            "integer": "int",
            "int": "int",
            "bigint": "int64",
            "string": "string",
            "text": "string",
            "boolean": "bool",
            "bool": "bool",
            "float": "float64",
            "decimal": "float64",
            "date": "time.Time",
            "datetime": "time.Time",
            "uuid": "string",
            "json": "map[string]interface{}",
            "array": "[]interface{}",
            "object": "map[string]interface{}",
        }.get(ir_type, "interface{}")

    @staticmethod
    def _gorm_tag(field_obj) -> str:
        """Generate a GORM struct tag string for a field."""
        parts = []
        if getattr(field_obj, "primary", False):
            parts.append("primaryKey")
            parts.append("autoIncrement")
        else:
            parts.append(f"column:{field_obj.name}")
        if getattr(field_obj, "nullable", False):
            pass  # nullable is the default in GORM
        elif not getattr(field_obj, "primary", False):
            parts.append("not null")
        if getattr(field_obj, "default", None):
            parts.append(f"default:{field_obj.default}")
        return ";".join(parts)

    @staticmethod
    def _strip_prefix(value: str, prefix: str) -> str:
        if value.lower().startswith(prefix.lower()):
            return value[len(prefix):]
        return value

    @staticmethod
    def _is_write_method(method_name: str) -> bool:
        lower = method_name.lower()
        return any(lower.startswith(p) for p in ("create", "save", "update", "delete", "remove"))
