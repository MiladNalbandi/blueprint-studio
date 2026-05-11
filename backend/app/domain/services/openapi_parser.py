"""Parse OpenAPI 3.x specs into FlowForge nodes_created payloads."""

from __future__ import annotations


class OpenAPIParser:
    """Converts an OpenAPI 3.x spec dict into a nodes + edges payload
    compatible with the chat nodes_created format."""

    def parse(self, spec: dict) -> dict:
        """Parse an OpenAPI spec → {nodes, edges} payload."""
        nodes: list[dict] = []
        edges: list[dict] = []
        schema_node_map: dict[str, str] = {}  # schema name → tempId
        endpoint_service_map: dict[str, str] = {}  # base_path → service tempId
        counter = {"n": 0}

        def next_id(prefix: str) -> str:
            counter["n"] += 1
            return f"{prefix}_{counter['n']}"

        # 1. Parse schemas → entity or DTO nodes
        schemas = (spec.get("components") or {}).get("schemas") or {}
        # Track which schemas are used in requestBody vs responses
        request_schemas = set()
        response_schemas = set()
        self._classify_schemas(spec, request_schemas, response_schemas)

        for name, schema_def in schemas.items():
            fields = self._parse_schema_fields(schema_def)
            is_entity = self._is_entity(name, schema_def, request_schemas, response_schemas)

            if is_entity:
                temp_id = next_id("entity")
                nodes.append({
                    "tempId": temp_id,
                    "type": "entity",
                    "label": name,
                    "config": {
                        "tableName": self._to_table_name(name),
                        "fields": fields,
                        "relations": [],
                        "indexes": [],
                    },
                })
            else:
                temp_id = next_id("dto")
                nodes.append({
                    "tempId": temp_id,
                    "type": "dto",
                    "label": name,
                    "config": {"fields": fields, "description": schema_def.get("description", "")},
                })
            schema_node_map[name] = temp_id

        # 2. Parse paths → endpoint + response nodes
        paths = spec.get("paths") or {}
        for path, path_item in paths.items():
            for method in ("get", "post", "put", "patch", "delete", "options", "head"):
                if method not in path_item:
                    continue
                operation = path_item[method]
                ep_id = next_id("ep")
                nodes.append({
                    "tempId": ep_id,
                    "type": "endpoint",
                    "label": operation.get("summary") or f"{method.upper()} {path}",
                    "config": {
                        "method": method.upper(),
                        "path": path,
                        "description": operation.get("description", ""),
                    },
                })

                # Edge: endpoint → requestBody DTO
                req_body = operation.get("requestBody", {})
                req_schema_name = self._extract_schema_ref(req_body)
                if req_schema_name and req_schema_name in schema_node_map:
                    edges.append({"from": ep_id, "to": schema_node_map[req_schema_name]})

                # Response nodes + edges
                for status_code, resp_def in (operation.get("responses") or {}).items():
                    try:
                        status_int = int(status_code)
                    except ValueError:
                        status_int = 200
                    resp_id = next_id("resp")
                    nodes.append({
                        "tempId": resp_id,
                        "type": "response",
                        "label": f"{status_code} {resp_def.get('description', '')}".strip(),
                        "config": {"status": status_int, "type": "json", "description": resp_def.get("description", "")},
                    })
                    edges.append({"from": ep_id, "to": resp_id})

                    # Edge: response → response DTO schema
                    resp_schema_name = self._extract_schema_ref(resp_def)
                    if resp_schema_name and resp_schema_name in schema_node_map:
                        edges.append({"from": resp_id, "to": schema_node_map[resp_schema_name]})

                # 3. Smart service inference by base path
                base_path = self._base_path(path)
                if base_path not in endpoint_service_map:
                    svc_id = next_id("svc")
                    svc_name = self._path_to_name(base_path)
                    nodes.append({
                        "tempId": svc_id,
                        "type": "service",
                        "label": f"{svc_name} Service",
                        "config": {"methods": [], "description": ""},
                    })
                    endpoint_service_map[base_path] = svc_id

                    # Also create a repository if there are entities
                    if schema_node_map:
                        repo_id = next_id("repo")
                        nodes.append({
                            "tempId": repo_id,
                            "type": "repository",
                            "label": f"{svc_name} Repository",
                            "config": {"methods": ["findAll", "findById", "save", "delete"]},
                        })
                        edges.append({"from": svc_id, "to": repo_id})
                        # Link repo to closest entity
                        for ename, eid in schema_node_map.items():
                            entity_node = next((n for n in nodes if n["tempId"] == eid and n["type"] == "entity"), None)
                            if entity_node:
                                edges.append({"from": repo_id, "to": eid})
                                break

                svc_id = endpoint_service_map[base_path]
                edges.append({"from": ep_id, "to": svc_id})

                # Add method to service
                svc_node = next(n for n in nodes if n["tempId"] == svc_id)
                method_name = self._method_name_for_endpoint(method, path)
                if method_name not in svc_node["config"]["methods"]:
                    svc_node["config"]["methods"].append(method_name)

        # 4. Parse security schemes → middleware nodes
        security_schemes = (spec.get("components") or {}).get("securitySchemes") or {}
        for scheme_name, scheme_def in security_schemes.items():
            mid_id = next_id("mid")
            nodes.append({
                "tempId": mid_id,
                "type": "middleware",
                "label": f"Auth: {scheme_name}",
                "config": {
                    "type": "auth",
                    "description": f"{scheme_def.get('type', 'unknown')} - {scheme_def.get('scheme', '')}".strip(" -"),
                },
            })

        return {"nodes": nodes, "edges": edges}

    def _classify_schemas(self, spec: dict, request_schemas: set, response_schemas: set) -> None:
        """Walk paths to classify which schemas are used in request vs response."""
        for path_item in (spec.get("paths") or {}).values():
            for method in ("get", "post", "put", "patch", "delete"):
                op = path_item.get(method)
                if not op:
                    continue
                req_ref = self._extract_schema_ref(op.get("requestBody", {}))
                if req_ref:
                    request_schemas.add(req_ref)
                for resp_def in (op.get("responses") or {}).values():
                    resp_ref = self._extract_schema_ref(resp_def)
                    if resp_ref:
                        response_schemas.add(resp_ref)

    def _is_entity(self, name: str, schema: dict, request_schemas: set, response_schemas: set) -> bool:
        """Heuristic: entity if it has an 'id' field and is primarily in responses."""
        props = schema.get("properties") or {}
        has_id = "id" in props
        in_request = name in request_schemas
        in_response = name in response_schemas
        if has_id and not in_request:
            return True
        if has_id and in_response and not in_request:
            return True
        return False

    def _parse_schema_fields(self, schema: dict) -> list[dict]:
        fields = []
        required = set(schema.get("required") or [])
        for fname, fdef in (schema.get("properties") or {}).items():
            ir_type = self._openapi_to_ir_type(fdef)
            is_primary = fname == "id"
            fields.append({
                "name": fname,
                "type": ir_type,
                "primary": is_primary,
                "nullable": fname not in required and not is_primary,
            })
        return fields

    @staticmethod
    def _openapi_to_ir_type(field_def: dict) -> str:
        oa_type = field_def.get("type", "string")
        oa_format = field_def.get("format", "")
        if oa_type == "integer":
            return "integer"
        if oa_type == "number":
            return "float"
        if oa_type == "boolean":
            return "boolean"
        if oa_type == "string":
            if oa_format == "date-time":
                return "datetime"
            if oa_format == "date":
                return "date"
            if oa_format == "uuid":
                return "uuid"
            return "string"
        if oa_type == "array":
            return "json"
        if oa_type == "object":
            return "json"
        return "string"

    @staticmethod
    def _extract_schema_ref(obj: dict) -> str | None:
        """Extract schema name from $ref in requestBody or response content."""
        content = obj.get("content", {})
        for media in content.values():
            schema = media.get("schema", {})
            ref = schema.get("$ref", "")
            if ref:
                return ref.rsplit("/", 1)[-1]
            items = schema.get("items", {})
            ref = items.get("$ref", "")
            if ref:
                return ref.rsplit("/", 1)[-1]
        # Direct $ref on the object
        ref = obj.get("$ref", "")
        if ref:
            return ref.rsplit("/", 1)[-1]
        return None

    @staticmethod
    def _base_path(path: str) -> str:
        """Extract base resource path: /api/users/{id} → /api/users."""
        parts = [p for p in path.strip("/").split("/") if not p.startswith("{")]
        return "/" + "/".join(parts)

    @staticmethod
    def _path_to_name(path: str) -> str:
        """Convert /api/users → User."""
        parts = [p for p in path.strip("/").split("/") if p and p != "api"]
        if parts:
            word = parts[-1]
            # Simple singularize
            if word.endswith("ies"):
                word = word[:-3] + "y"
            elif word.endswith("s") and not word.endswith("ss"):
                word = word[:-1]
            return word.capitalize()
        return "Resource"

    @staticmethod
    def _method_name_for_endpoint(http_method: str, path: str) -> str:
        has_param = "{" in path
        mapping = {
            "get": "findById" if has_param else "findAll",
            "post": "create",
            "put": "update",
            "patch": "update",
            "delete": "delete",
        }
        return mapping.get(http_method.lower(), "handle")

    @staticmethod
    def _to_table_name(name: str) -> str:
        """PascalCase → snake_case plural."""
        import re
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
        snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
        if not snake.endswith("s"):
            snake += "s"
        return snake
