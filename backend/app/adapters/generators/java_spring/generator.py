"""Java Spring Boot code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class SpringBootGenerator(BaseGenerator):
    language = "java"
    framework = "spring"

    def __init__(self):
        super().__init__()
        self.env.filters["java_type"] = self._java_type
        self.env.filters["strip_prefix"] = self._strip_prefix
        self.env.tests["write_method"] = self._is_write_method

    def _template_subdir(self) -> str:
        return "java_spring/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []
        base_pkg = "src/main/java/com/app"

        # Entities → src/main/java/com/app/entity/{PascalCase}.java
        for entity in ir.entities:
            name = self._pascal_case(entity.name)
            content = self.render("entity.java.j2", entity=entity, ir=ir)
            files.append(GeneratedFile(path=f"{base_pkg}/entity/{name}.java", content=content))

        # DTOs → src/main/java/com/app/dto/{PascalCase}.java
        for dto in ir.dtos:
            name = self._pascal_case(dto.name)
            content = self.render("dto.java.j2", dto=dto, ir=ir)
            files.append(GeneratedFile(path=f"{base_pkg}/dto/{name}.java", content=content))

        # Repositories → src/main/java/com/app/repository/{PascalCase}Repository.java
        for repo in ir.repositories:
            entity_name = self._resolve_entity_name(repo.entity, ir)
            content = self.render("repository.java.j2", repository=repo, entity_name=entity_name, ir=ir)
            files.append(GeneratedFile(path=f"{base_pkg}/repository/{entity_name}Repository.java", content=content))

        # Services → src/main/java/com/app/service/{PascalCase}Service.java
        for service in ir.services:
            name = self._pascal_case(service.name)
            suffix = "" if name.endswith("Service") else "Service"
            entity_name = self._resolve_entity_name(service.repository, ir) if service.repository else ""
            content = self.render(
                "service.java.j2", service=service, name=name + suffix,
                entity_name=entity_name, ir=ir,
            )
            files.append(GeneratedFile(path=f"{base_pkg}/service/{name}{suffix}.java", content=content))

        # Controllers — group endpoints by base path
        route_groups: dict[str, list] = {}
        for endpoint in ir.endpoints:
            route_name = self._route_name(endpoint.path)
            route_groups.setdefault(route_name, []).append(endpoint)

        for route_name, endpoints in route_groups.items():
            controller_name = self._pascal_case(route_name)
            service_names: list[str] = []
            for ep in endpoints:
                svc = self._pascal_case(ep.service_name) if ep.service_name else ""
                if svc and not svc.endswith("Service"):
                    svc = svc + "Service"
                if svc and svc not in service_names:
                    service_names.append(svc)
            service_name = service_names[0] if service_names else ""
            base_path = "/" + route_name.lower()
            content = self.render(
                "controller.java.j2", endpoints=endpoints, ir=ir,
                controller_name=controller_name, service_name=service_name,
                base_path=base_path,
            )
            files.append(GeneratedFile(path=f"{base_pkg}/controller/{controller_name}Controller.java", content=content))

        # Application.java
        content = self.render("application.java.j2", ir=ir)
        files.append(GeneratedFile(path=f"{base_pkg}/Application.java", content=content))

        # application.properties
        content = self.render("application.properties.j2", ir=ir)
        files.append(GeneratedFile(path="src/main/resources/application.properties", content=content))

        # Build manifest — choose template based on package manager
        pm = (ir.package_manager or "maven").lower()
        if pm == "gradle":
            content = self.render("build.gradle.j2", ir=ir)
            files.append(GeneratedFile(path="build.gradle", content=content))
            content = self.render("settings.gradle.j2", ir=ir)
            files.append(GeneratedFile(path="settings.gradle", content=content))
        else:
            content = self.render("pom.xml.j2", ir=ir)
            files.append(GeneratedFile(path="pom.xml", content=content))

        return files

    def _resolve_entity_name(self, entity_ref: str, ir: IR) -> str:
        # Direct entity match
        for entity in ir.entities:
            if entity.id == entity_ref or entity.name == entity_ref:
                return self._pascal_case(entity.name)
        # Indirect: entity_ref might be a repository ID — resolve through repository
        for repo in ir.repositories:
            if repo.id == entity_ref or repo.name == entity_ref:
                for entity in ir.entities:
                    if entity.id == repo.entity or entity.name == repo.entity:
                        return self._pascal_case(entity.name)
        return self._pascal_case(entity_ref) if entity_ref else "Unknown"

    def _route_name(self, path: str) -> str:
        parts = [p for p in path.strip("/").split("/") if p and not p.startswith("{") and not p.startswith(":")]
        if parts:
            return self._pascal_case(parts[-1])
        return "Default"

    @staticmethod
    def _java_type(ir_type: str) -> str:
        return {
            "integer": "Integer",
            "int": "Integer",
            "bigint": "Long",
            "string": "String",
            "text": "String",
            "boolean": "Boolean",
            "bool": "Boolean",
            "float": "Double",
            "decimal": "BigDecimal",
            "date": "LocalDate",
            "datetime": "LocalDateTime",
            "uuid": "UUID",
            "json": "String",
            "object": "String",
        }.get(ir_type, "String")

    @staticmethod
    def _strip_prefix(value: str, prefix: str) -> str:
        if value.lower().startswith(prefix.lower()):
            return value[len(prefix):]
        return value

    @staticmethod
    def _is_write_method(method_name: str) -> bool:
        lower = method_name.lower()
        return any(lower.startswith(p) for p in ("create", "save", "update", "delete", "remove"))
