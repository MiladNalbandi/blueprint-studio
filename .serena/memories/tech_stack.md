# FlowForge Tech Stack

## Frontend (frontend/)
- React 18 + TypeScript + Vite 6
- @xyflow/react v12 (React Flow) for visual canvas
- Tailwind CSS 3.4 + Radix UI primitives
- Zustand 5 (5 stores: project, flow, LLM, chat, UI)
- Axios for HTTP, Lucide React for icons
- clsx + tailwind-merge for class utilities

## Backend (backend/app/)
- Python 3.13 + FastAPI 0.115+
- SQLAlchemy 2.0 async + asyncpg (PostgreSQL 16)
- Alembic for migrations
- Celery 5.4 + Redis 7 for background tasks
- Jinja2 for code generation templates
- Pydantic v2 for validation
- Ruff for linting (line-length 120, target py313)

## Infrastructure
- Docker Compose: 5 services (api:8000, frontend:5173, celery_worker, postgres:5432, redis:6379)
