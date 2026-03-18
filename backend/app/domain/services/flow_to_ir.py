"""Convert a React Flow graph JSON into a language-agnostic IR."""

from app.domain.models.ir import (
    IR, IRDto, IREndpoint, IREntity, IREvent, IRField,
    IRLogicBlock, IRMiddleware, IRRepository, IRService, IRValidation,
)
from app.domain.models.project import FlowGraph, NodeType, ProjectConfig


class FlowToIRService:
    """Pure domain service — no I/O, no frameworks."""

    def convert(self, config: ProjectConfig, flow: FlowGraph) -> IR:
        ir = IR(
            language=config.language.value,
            framework=config.framework,
            database=config.database,
            orm=config.orm,
            architecture=config.architecture.value,
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
            )
            for f in cfg.get("fields", [])
        ]
        return IREntity(
            id=node.id,
            name=node.label or "Entity",
            table_name=cfg.get("tableName", ""),
            fields=fields,
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
        for endpoint in ir.endpoints:
            targets = outgoing.get(endpoint.id, [])
            for tid in targets:
                target = node_map.get(tid)
                if not target:
                    continue
                match target.type:
                    case NodeType.DTO:
                        endpoint.request_dto = tid
                    case NodeType.MIDDLEWARE:
                        endpoint.middlewares.append(tid)
                    case NodeType.SERVICE:
                        endpoint.service = tid

        for service in ir.services:
            targets = outgoing.get(service.id, [])
            for tid in targets:
                target = node_map.get(tid)
                if target and target.type == NodeType.REPOSITORY:
                    service.repository = tid
