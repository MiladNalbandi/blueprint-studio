"""Flow template API — pre-built node patterns."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

TEMPLATES_DIR = Path(__file__).parent.parent.parent.parent / "templates"


def _load_template(template_id: str) -> dict:
    path = TEMPLATES_DIR / f"{template_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return json.loads(path.read_text())


@router.get("/templates")
async def list_templates():
    """List available flow templates."""
    templates = []
    if TEMPLATES_DIR.exists():
        for f in sorted(TEMPLATES_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                templates.append({
                    "id": data.get("id", f.stem),
                    "name": data.get("name", f.stem),
                    "description": data.get("description", ""),
                    "icon": data.get("icon", "template"),
                })
            except (json.JSONDecodeError, KeyError):
                continue
    return templates


def _normalize_edges(edges: list[dict]) -> list[dict]:
    """Ensure edges use 'from'/'to' keys (frontend format)."""
    return [
        {"from": e.get("from") or e.get("source", ""), "to": e.get("to") or e.get("target", "")}
        for e in edges
    ]


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a template's full node/edge payload."""
    data = _load_template(template_id)
    return {
        "id": data.get("id", template_id),
        "name": data.get("name", template_id),
        "description": data.get("description", ""),
        "icon": data.get("icon", "template"),
        "nodes": data.get("nodes", []),
        "edges": _normalize_edges(data.get("edges", [])),
    }
