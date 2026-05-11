# FlowForge — Visual Code Architecture Builder

## What is this?

FlowForge lets users visually design backend architectures (entities, endpoints, services, etc.) on a canvas, then generates clean code from the flow graph. Pipeline: **Wizard → Canvas → IR → Code Generation**.

## Running the project

Everything runs in Docker:

```bash
docker compose up --build -d     # start all services
docker compose down               # stop
docker compose logs api --tail 50 # backend logs
docker compose logs frontend      # frontend logs
```

**Services:**
| Service | Port | Description |
|---------|------|-------------|
| `api` | 8000 | FastAPI backend (uvicorn --reload, volume-mounted) |
| `frontend` | 5173 | Vite + React dev server (src volume-mounted) |
| `postgres` | 5432 | PostgreSQL 16 (user: `flowforge`, pass: `flowforge_dev`, db: `flowforge`) |
| `redis` | 6379 | Redis 7 (for Celery task queue) |
| `celery_worker` | — | Celery worker for code generation tasks |

**Important:** Backend and frontend code are volume-mounted, so local edits are reflected immediately (hot-reload). But if you change `pyproject.toml` or `package.json`, you must `docker compose up --build -d` to install new dependencies.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Zustand (state) + React Flow (canvas) + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy (async, asyncpg) + Alembic + Celery + Jinja2 (templates)
- **Infra:** Docker Compose, PostgreSQL 16, Redis 7

## Project Structure

```
frontend/
  src/
    components/
      canvas/        # FlowNode.tsx, Canvas.tsx — React Flow canvas
      chat/          # ChatPanel.tsx — AI chat sidebar
      config/        # ConfigPanel, editors/ (EntityEditor, etc.) — node config
      dashboard/     # Project list/dashboard
      function-builder/ # AI function code editor
      wizard/        # Project creation wizard
      ui/            # Shared UI components
    stores/          # Zustand stores (index.ts, useFunctionStore.ts)
    constants/       # index.ts — languages, frameworks, node types, defaults
    types/           # index.ts — TypeScript type definitions
    api/             # API client functions

backend/
  app/
    main.py                    # FastAPI app entry point
    config.py                  # Settings (pydantic-settings, reads .env)
    api/
      routes/                  # REST endpoints
        projects.py            # CRUD projects
        flows.py               # Save/load flow graphs
        chat.py                # AI chat (REST + WebSocket)
        llm_config.py          # LLM provider CRUD
        generate.py            # Code generation trigger
        functions.py           # Function definitions CRUD
      schemas/                 # Pydantic request/response schemas
      dependencies.py          # FastAPI dependency injection
    domain/
      models/
        project.py             # Domain models (Project, FlowGraph, Node, Edge, etc.)
        ir.py                  # Intermediate Representation (IREntity, IREndpoint, etc.)
      services/
        flow_to_ir.py          # Converts React Flow JSON → IR
        function_generator.py  # AI-powered function body generation
    adapters/
      llm/                     # LLM provider adapters (claude, openai, gemini)
        factory.py             # create_llm_provider() factory
        claude_adapter.py
        openai_adapter.py
        gemini_adapter.py
      persistence/             # Database layer
        database.py            # SQLAlchemy engine/session
        models.py              # SQLAlchemy ORM models
        postgres_repository.py # Repository implementation
      generators/              # Code generation templates (Jinja2)
      export/                  # Export adapters (zip, etc.)
    ports/
      interfaces.py            # Port interfaces (hexagonal architecture)
```

## Architecture Pattern

Backend uses **hexagonal architecture** (ports & adapters):
- `ports/interfaces.py` — abstract interfaces (ProjectRepositoryPort, LLMProviderPort)
- `adapters/` — concrete implementations
- `domain/` — pure business logic, no framework imports

## Key Data Flow

1. **Wizard** creates a `Project` with config (language, framework, DB, ORM, architecture)
2. **Canvas** lets users place nodes (entity, endpoint, service, etc.) and connect them
3. **Chat AI** can create nodes via JSON blocks in responses
4. **Flow → IR:** `FlowToIRService.convert()` transforms React Flow graph into language-agnostic IR
5. **IR → Code:** Generator adapters render IR through Jinja2 templates into actual code files

## Node Types

`endpoint`, `dto`, `validator`, `logic`, `entity`, `response`, `middleware`, `service`, `repository`, `event`

Each node type has a config shape defined in `DEFAULT_NODE_CONFIGS` (constants/index.ts) and a corresponding editor component in `components/config/editors/`.

## Entity Config Shape (enhanced)

```typescript
{
  tableName: string;
  fields: [{ name, type, primary?, nullable?, unique?, defaultValue? }];
  relations: [{ type: 'belongsTo'|'hasOne'|'hasMany'|'manyToMany', target, foreignKey?, pivotTable? }];
  indexes: [{ columns: string[], unique?, name? }];
}
```

## Database Access

```bash
# Direct psql
docker compose exec postgres psql -U flowforge -d flowforge

# Key tables: projects, flow_nodes, flow_edges, llm_configs, function_definitions
```

## LLM Configuration

LLM API keys are stored per-project in the `llm_configs` table. The chat endpoint (`/api/projects/{id}/chat`) picks the **first** config for the project. API keys are currently stored as plaintext (encryption TODO exists but is not implemented).

Valid Claude model IDs: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, `claude-haiku-4-5-20241022`

## Type Checking

```bash
cd frontend && npx tsc --noEmit   # TypeScript check
```

## Style Conventions

- **Frontend:** "Forge" dark theme — dark surfaces (`var(--surface-0)`, `var(--surface-1)`), cyan accent (`#22d3ee`), orange/ember accent (`forge-400`/`#f97316`). Font: monospace for code, `font-display` for labels.
- **Backend:** Standard Python conventions, ruff for linting (line-length 120).
- **Component pattern:** Each editor is a standalone component receiving `{ config, onChange }` props.
- **Labels:** `text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500`
- **Inputs:** `text-xs text-zinc-200 font-mono`, background `var(--surface-0)`, border `var(--border-subtle)`
