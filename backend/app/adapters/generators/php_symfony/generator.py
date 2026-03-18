"""PHP Symfony code generator."""

from app.adapters.generators.base.generator import BaseGenerator
from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile


class SymfonyGenerator(BaseGenerator):
    language = "php"
    framework = "symfony"

    def _template_subdir(self) -> str:
        return "php_symfony/templates"

    def generate(self, ir: IR) -> list[GeneratedFile]:
        files: list[GeneratedFile] = []

        # Entities
        for entity in ir.entities:
            content = self.render("entity.php.j2", entity=entity, ir=ir)
            path = f"src/Entity/{entity.name | self._pascal_case}.php"
            files.append(GeneratedFile(path=path, content=content))

        # DTOs
        for dto in ir.dtos:
            content = self.render("dto.php.j2", dto=dto, ir=ir)
            path = f"src/DTO/{dto.name | self._pascal_case}DTO.php"
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
            path = f"src/Service/{self._pascal_case(service.name)}Service.php"
            files.append(GeneratedFile(path=path, content=content))

        # Controllers
        for endpoint in ir.endpoints:
            content = self.render("controller.php.j2", endpoint=endpoint, ir=ir)
            name = self._controller_name(endpoint.path)
            path = f"src/Controller/{name}Controller.php"
            files.append(GeneratedFile(path=path, content=content))

        return files

    def _resolve_entity_name(self, entity_id: str, ir: IR) -> str:
        for entity in ir.entities:
            if entity.id == entity_id:
                return self._pascal_case(entity.name)
        return "Unknown"

    def _controller_name(self, path: str) -> str:
        parts = [p for p in path.strip("/").split("/") if p and not p.startswith("{")]
        if parts:
            return self._pascal_case(parts[-1])
        return "Default"
