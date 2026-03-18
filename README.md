# ⚒️ FlowForge

**Visual code architecture builder** — design your backend visually, generate clean code.

Drag-and-drop endpoints, DTOs, validators, services, entities, and logic blocks onto a canvas, connect them with edges to define data flow, and generate a full, idiomatic codebase in your chosen language and framework.

## Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Canvas** | React Flow (@xyflow/react) |
| **UI** | Tailwind CSS + shadcn/ui |
| **State** | Zustand |
| **Backend** | Python 3.13 + FastAPI |
| **Code Generation** | Jinja2 templates |
| **LLM Providers** | Claude (Anthropic) / GPT (OpenAI) / Gemini (Google) |
| **Database** | PostgreSQL 16 + SQLAlchemy 2.0 async |
| **Migrations** | Alembic |
| **Task Queue** | Celery + Redis |
| **Architecture** | Hexagonal (Ports & Adapters) |

## Quick Start

### Prerequisites
- Docker + Docker Compose
- (Optional) Node.js 22+ and Python 3.13+ for local dev without Docker

### 1. Clone and configure

```bash
git clone <your-repo-url> flowforge
cd flowforge
cp .env.example .env
# Edit .env — add your LLM API keys
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts:
- **API** at http://localhost:8000 (FastAPI + auto-reload)
- **Frontend** at http://localhost:5173 (Vite + HMR)
- **PostgreSQL** at localhost:5432
- **Redis** at localhost:6379
- **Celery worker** for background generation

### 3. Run database migrations

```bash
docker compose exec api alembic upgrade head
```

### 4. Open the app

Visit http://localhost:5173

---

### Local dev without Docker

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Start PostgreSQL and Redis locally, then:
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
flowforge/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Pydantic settings
│   │   ├── domain/                    # Pure business logic
│   │   │   ├── models/                # Project, IR, Generation dataclasses
│   │   │   └── services/              # flow_to_ir, chat_orchestrator
│   │   ├── ports/                     # Abstract interfaces (ABCs)
│   │   │   └── interfaces.py          # LLMProvider, CodeGenerator, Repository
│   │   ├── adapters/                  # Implementations
│   │   │   ├── llm/                   # Claude, OpenAI, Gemini adapters
│   │   │   ├── generators/            # Jinja2 code generators per stack
│   │   │   ├── persistence/           # PostgreSQL + SQLAlchemy
│   │   │   └── export/                # Zip exporter
│   │   ├── api/                       # FastAPI routes + schemas
│   │   ├── tasks/                     # Celery background tasks
│   │   └── migrations/                # Alembic
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/                # React components
│       │   ├── canvas/                # React Flow canvas + custom nodes
│       │   ├── wizard/                # Project setup wizard
│       │   ├── chat/                  # AI chat panel
│       │   └── config/                # Node config panel
│       ├── stores/                    # Zustand state management
│       ├── api/                       # API client (axios)
│       └── types/                     # TypeScript types
├── docker-compose.yml
└── .env.example
```

## Adding a New Code Generator

1. Create `backend/app/adapters/generators/your_stack/`
2. Add Jinja2 templates in `templates/`
3. Implement the generator class extending `BaseGenerator`
4. Register it in `backend/app/api/routes/generate.py` → `GENERATORS` list

## Adding a New LLM Provider

1. Create `backend/app/adapters/llm/your_provider_adapter.py`
2. Implement `LLMProviderPort` (chat + stream methods)
3. Add it to the factory in `backend/app/adapters/llm/factory.py`

## API Docs

FastAPI auto-generates OpenAPI docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Roadmap

- [x] Phase 1: Project wizard + core data model
- [x] Phase 2: Visual canvas with drag-and-drop
- [x] Phase 3: Node configuration + validation
- [ ] Phase 4: Data flow simulation
- [ ] Phase 5: Code generation (Symfony first)
- [ ] Phase 6: Multi-stack generators
- [ ] Phase 7: Persistence, export, collaboration

## License

MIT
