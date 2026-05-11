# Blueprint Studio

**Design backend APIs visually, generate production code in your favorite stack.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![Node 22+](https://img.shields.io/badge/node-22%2B-green.svg)](https://nodejs.org/)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)]()

Drag-and-drop endpoints, DTOs, validators, services, entities, and logic blocks onto a canvas, connect them to define data flow, and generate a full, idiomatic codebase in your chosen language and framework. An AI chat assistant helps you design and modify the graph; an AI-powered function builder fills in business logic.

> **About the name.** The public project is **Blueprint Studio**. The code, services, env vars, and Postgres database are still named `flowforge` (the original working title). Both refer to the same project — only the public brand changed.

---

## A 30-second tour

1. Open the wizard, pick a stack (e.g. Python/FastAPI + Postgres + SQLAlchemy + Hexagonal).
2. Drop an `Entity` node for `User`, an `Endpoint` for `POST /users`, a `DTO`, a `Validator`, and a `Service`. Connect them with edges.
3. Ask the chat: *"add a `getUserById` endpoint that returns the user dto"* — the AI proposes nodes and edges as a JSON block; you accept.
4. Click **Generate** → download a zip with a working FastAPI project: routes, schemas, SQLAlchemy models, services, Alembic migration, `pyproject.toml`, `Dockerfile`.

---

## Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Canvas** | React Flow (`@xyflow/react`) |
| **UI** | Tailwind CSS, custom "Forge" dark theme |
| **State** | Zustand |
| **Backend** | Python 3.13 + FastAPI |
| **Code Generation** | Jinja2 templates per stack |
| **LLM Providers** | Anthropic Claude / OpenAI / Google Gemini |
| **Database** | PostgreSQL 16 + SQLAlchemy 2.0 async |
| **Migrations** | Alembic |
| **Task Queue** | Celery + Redis |
| **Architecture** | Hexagonal (ports & adapters) |

### Generators currently shipped

| Stack | Status |
|---|---|
| Python · FastAPI · SQLAlchemy | ✅ |
| TypeScript · NestJS | ✅ |
| TypeScript · Fastify | ✅ |
| Go · Gin | ✅ |
| Java · Spring Boot | ✅ |
| PHP · Symfony | ✅ |
| Docker / docker-compose | ✅ |
| LLM-fallback (any stack) | ✅ experimental |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- *(Optional, for non-Docker dev)* Node.js 22+ and Python 3.13+

### 1. Clone and configure

```bash
git clone https://github.com/MiladNalbandi/blueprint-studio.git
cd blueprint-studio
cp .env.example .env
# Edit .env if you want to seed LLM API keys for development.
# Keys can also be entered per-project from the UI later.
```

### 2. Start everything

```bash
docker compose up --build -d
```

This boots:
- **API** at <http://localhost:8000> (FastAPI + auto-reload)
- **Frontend** at <http://localhost:5173> (Vite + HMR)
- **PostgreSQL** at `localhost:5432`
- **Redis** at `localhost:6379`
- **Celery worker** for background code generation

### 3. Run database migrations

```bash
docker compose exec api alembic upgrade head
```

### 4. Open the app

Visit <http://localhost:5173> and create your first project.

---

## Local dev without Docker

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
# Start PostgreSQL and Redis locally first, then:
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
blueprint-studio/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── config.py           # Pydantic settings
│   │   ├── domain/             # Pure business logic
│   │   │   ├── models/         # Project, IR, Generation
│   │   │   └── services/       # flow_to_ir, function_generator, openapi_parser
│   │   ├── ports/              # Abstract interfaces
│   │   ├── adapters/
│   │   │   ├── llm/            # Claude, OpenAI, Gemini
│   │   │   ├── generators/     # Per-stack Jinja2 generators
│   │   │   ├── persistence/    # PostgreSQL + SQLAlchemy
│   │   │   └── export/         # Zip exporter
│   │   ├── api/                # FastAPI routes + schemas
│   │   ├── tasks/              # Celery background tasks
│   │   └── migrations/         # Alembic
│   ├── templates/              # Project starter templates (CRUD, auth, etc.)
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── canvas/         # React Flow canvas + custom nodes
│       │   ├── wizard/         # Project setup wizard
│       │   ├── chat/           # AI chat panel + session list
│       │   ├── config/         # Node config editors
│       │   ├── function-builder/   # AI-assisted function editor
│       │   ├── code-preview/   # Generated code browser
│       │   └── dashboard/      # Project list/dashboard
│       ├── stores/             # Zustand stores
│       ├── api/                # API client
│       └── types/              # TypeScript types
├── docker-compose.yml
└── .env.example
```

Architecture details: see [CLAUDE.md](CLAUDE.md) for an internal map of modules and data flow.

---

## Extending

### Add a new code generator
1. Create `backend/app/adapters/generators/your_stack/`.
2. Add Jinja2 templates under `templates/`.
3. Implement a class extending `BaseGenerator`.
4. Register it in `backend/app/api/routes/generate.py` → `GENERATORS`.

### Add a new LLM provider
1. Create `backend/app/adapters/llm/your_provider_adapter.py`.
2. Implement `LLMProviderPort` (`chat` + `stream`).
3. Register it in `backend/app/adapters/llm/factory.py`.

---

## API Docs

FastAPI ships interactive OpenAPI docs:
- Swagger UI — <http://localhost:8000/docs>
- ReDoc — <http://localhost:8000/redoc>

---

## Roadmap

- [x] Project wizard + core data model
- [x] Visual canvas with drag-and-drop
- [x] Node configuration + validation
- [x] Project dashboard + lifecycle
- [x] AI chat assistant (per-project, session-restorable)
- [x] AI function builder with revision history
- [x] OpenAPI import → canvas
- [x] Template gallery (CRUD, auth, event-driven, file upload, search/filter)
- [x] Multi-stack code generators
- [x] Code preview panel (file tree, log terminal, endpoint tester)
- [ ] Encrypt stored LLM API keys at rest
- [ ] CI workflow (lint, type-check, build)
- [ ] Real-time collaboration
- [ ] Hosted demo

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the dev setup, branch/commit conventions, and how to add new generators or LLM providers.

---

## Security

- Never commit `.env` — it's already gitignored. Use `.env.example` as the template.
- LLM API keys entered via the UI are stored in the `llm_configs` table; at-rest encryption is on the roadmap (see open issue).
- If you find a security issue, please open a private security advisory on GitHub instead of a public issue.

---

## License

**GNU Affero General Public License v3.0** — see [LICENSE](LICENSE).

AGPL-3.0 is a strong copyleft license. In plain language:

- You can use, study, modify, and redistribute this project freely.
- If you **distribute** a modified version, you must release your changes under AGPL-3.0.
- If you **run** a modified version on a network server that users interact with (e.g. a hosted SaaS), you must also release the source of your modifications to those users — the same applies. This closes the "SaaS loophole" that regular GPL leaves open.

If AGPL-3.0 is incompatible with your use case, open a discussion — commercial / dual-licensing arrangements may be possible.
