"""Convert a React Flow graph JSON into a language-agnostic IR."""

from __future__ import annotations

from app.domain.models.ir import (
    IR, IRDto, IREndpoint, IREntity, IREvent, IRField,
    IRLogicBlock, IRMethodImplementation, IRMiddleware, IRRepository, IRResponse, IRService, IRValidation,
)
from app.domain.models.project import FlowGraph, FunctionDefinition, NodeType, ProjectConfig
from app.domain.constants.package_defaults import resolve_dependencies


class FlowToIRService:
    """Pure domain service — no I/O, no frameworks."""

    def convert(
        self,
        config: ProjectConfig,
        flow: FlowGraph,
        function_definitions: list[FunctionDefinition] | None = None,
    ) -> IR:
        ir = IR(
            language=config.language.value,
            framework=config.framework,
            database=config.database,
            orm=config.orm,
            architecture=config.architecture.value,
            package_manager=config.package_manager,
            dependencies=resolve_dependencies(config),
        )

        # Index nodes by id
        node_map = {n.id: n for n in flow.nodes}

        # Build adjacency from edges
        outgoing: dict[str, list[str]] = {}
        for edge in flow.edges:
            outgoing.setdefault(edge.source, []).append(edge.target)
            ir.connections.append({"from": edge.source, "to": edge.target})

        # Convert each node to IR component
        for node in flow.nodes:
            match node.type:
                case NodeType.ENDPOINT:
                    ir.endpoints.append(self._to_endpoint(node, outgoing))
                case NodeType.DTO:
                    ir.dtos.append(self._to_dto(node))
                case NodeType.VALIDATOR:
                    # Validators attach to DTOs — handled in _to_dto via edges
                    pass
                case NodeType.ENTITY:
                    ir.entities.append(self._to_entity(node))
                case NodeType.SERVICE:
                    ir.services.append(self._to_service(node, outgoing))
                case NodeType.REPOSITORY:
                    ir.repositories.append(self._to_repository(node))
                case NodeType.MIDDLEWARE:
                    ir.middlewares.append(self._to_middleware(node))
                case NodeType.EVENT:
                    ir.events.append(self._to_event(node))
                case NodeType.LOGIC:
                    ir.logic_blocks.append(self._to_logic(node))
                case NodeType.RESPONSE:
                    pass  # Responses are metadata on endpoints

        # Resolve cross-references (endpoint → dto, service → repository, etc.)
        self._resolve_references(ir, flow, outgoing, node_map)

        # Populate method implementations from function definitions
        if function_definitions:
            self._populate_implementations(ir, function_definitions)

        return ir

    def _to_endpoint(self, node, outgoing) -> IREndpoint:
        cfg = node.config
        return IREndpoint(
            id=node.id,
            method=cfg.get("method", "GET"),
            path=cfg.get("path", "/"),
            description=cfg.get("description", ""),
        )

    def _to_dto(self, node) -> IRDto:
        cfg = node.config
        fields = [
            IRField(name=f["name"], type=f.get("type", "string"))
            for f in cfg.get("fields", [])
        ]
        validations = [
            IRValidation(field=r["field"], rule=r["rule"])
            for r in cfg.get("rules", [])
        ]
        return IRDto(
            id=node.id,
            name=node.label or "Dto",
            fields=fields,
            validations=validations,
            on_validation_fail=cfg.get("onFail", "422"),
        )

    def _to_entity(self, node) -> IREntity:
        cfg = node.config
        fields = [
            IRField(
                name=f["name"],
                type=f.get("type", "string"),
                primary=f.get("primary", False),
                nullable=f.get("nullable", False),
                default=f.get("defaultValue"),
            )
            for f in cfg.get("fields", [])
        ]
        return IREntity(
            id=node.id,
            name=node.label or "Entity",
            table_name=cfg.get("tableName", ""),
            fields=fields,
            relations=cfg.get("relations", []),
            indexes=cfg.get("indexes", []),
        )

    def _to_service(self, node, outgoing) -> IRService:
        cfg = node.config
        return IRService(
            id=node.id,
            name=cfg.get("name", node.label or "Service"),
            methods=cfg.get("methods", []),
            description=cfg.get("description", ""),
        )

    def _to_repository(self, node) -> IRRepository:
        cfg = node.config
        return IRRepository(
            id=node.id,
            name=node.label or "Repository",
            entity=cfg.get("entity", ""),
            methods=cfg.get("methods", ["find_all", "find_by_id", "save", "delete"]),
        )

    def _to_middleware(self, node) -> IRMiddleware:
        cfg = node.config
        return IRMiddleware(id=node.id, type=cfg.get("type", "auth"), config=cfg)

    def _to_event(self, node) -> IREvent:
        cfg = node.config
        return IREvent(
            id=node.id,
            name=cfg.get("name", node.label or "Event"),
            is_async=cfg.get("async", True),
        )

    def _to_logic(self, node) -> IRLogicBlock:
        cfg = node.config
        return IRLogicBlock(
            id=node.id,
            condition=cfg.get("condition", ""),
            output_count=cfg.get("outputs", 2),
            description=cfg.get("description", ""),
        )

    def _resolve_references(self, ir: IR, flow: FlowGraph, outgoing: dict, node_map: dict):
        """Walk edges to resolve cross-references between components."""
        # Index services by id for method lookup
        service_by_id = {s.id: s for s in ir.services}

        for endpoint in ir.endpoints:
            targets = outgoing.get(endpoint.id, [])
            for tid in targets:
                target = node_map.get(tid)
                if not target:
                    continue
                cfg = target.config or {}
                match target.type:
                    case NodeType.DTO:
                        endpoint.request_dto = tid
                        endpoint.request_dto_name = target.label or "Dto"
                    case NodeType.MIDDLEWARE:
                        endpoint.middlewares.append(tid)
                    case NodeType.SERVICE:
                        endpoint.service = tid
                        endpoint.service_name = cfg.get("name", target.label or "Service")
                        # Pick best-matching service method
                        svc = service_by_id.get(tid)
                        if svc and svc.methods:
                            endpoint.service_method = self._pick_service_method(
                                endpoint.method, endpoint.path, svc.methods,
                            )
                    case NodeType.RESPONSE:
                        try:
                            status = int(cfg.get("status", 200))
                        except (ValueError, TypeError):
                            status = 200
                        description = cfg.get("description", target.label or "")
                        resp_type = cfg.get("type", "json")
                        endpoint.responses.append(IRResponse(status=status, type=resp_type, description=description))

            # Set response_status to the first 2xx code found, fallback 200
            for resp in endpoint.responses:
                if 200 <= resp.status < 300:
                    endpoint.response_status = resp.status
                    break

        for service in ir.services:
            targets = outgoing.get(service.id, [])
            for tid in targets:
                target = node_map.get(tid)
                if not target:
                    continue
                if target.type == NodeType.REPOSITORY:
                    repo_entity = (target.config or {}).get("entity", target.label or "Unknown")
                    service.repository = repo_entity

    @staticmethod
    def _pick_service_method(http_method: str, path: str, methods: list[str]) -> str | None:
        """Pick the best-matching service method based on HTTP method + path pattern."""
        import re

        lower_path = path.lower()

        def _first_match(patterns: list[str]) -> str | None:
            for m in methods:
                ml = m.lower()
                if any(ml.startswith(p) for p in patterns):
                    return m
            return None

        match http_method.upper():
            case "GET":
                # Search/query/filter path → search method
                if re.search(r'(search|query|filter)', lower_path):
                    found = _first_match(["search", "query", "filter"])
                    if found:
                        return found
                # Path with {id} → findById
                if re.search(r'\{[^}]*id[^}]*\}', lower_path):
                    found = _first_match(["findbyid", "getbyid", "findone", "getone"])
                    if found:
                        return found
                # List endpoint
                found = _first_match(["findall", "getall", "list"])
                if found:
                    return found
            case "POST":
                found = _first_match(["create", "save", "add"])
                if found:
                    return found
            case "PUT" | "PATCH":
                found = _first_match(["update", "edit"])
                if found:
                    return found
            case "DELETE":
                found = _first_match(["delete", "remove"])
                if found:
                    return found

        # Fallback: first method in the list
        return methods[0] if methods else None

    def _populate_implementations(self, ir: IR, function_definitions: list[FunctionDefinition]):
        """Attach function bodies from DB to IR services and repositories."""
        # Index functions by node_id
        funcs_by_node: dict[str, list[FunctionDefinition]] = {}
        for func in function_definitions:
            if func.current_code:
                funcs_by_node.setdefault(func.node_id, []).append(func)

        for service in ir.services:
            for func in funcs_by_node.get(service.id, []):
                service.method_implementations.append(IRMethodImplementation(
                    name=func.name,
                    params=[{"name": p.name, "type": p.type, "default_value": p.default_value} for p in func.params],
                    return_type=func.return_type,
                    body=func.current_code,
                    description=func.description,
                ))

        for repo in ir.repositories:
            for func in funcs_by_node.get(repo.id, []):
                repo.method_implementations.append(IRMethodImplementation(
                    name=func.name,
                    params=[{"name": p.name, "type": p.type, "default_value": p.default_value} for p in func.params],
                    return_type=func.return_type,
                    body=func.current_code,
                    description=func.description,
                ))
