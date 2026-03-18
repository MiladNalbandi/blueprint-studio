# Code Style & Conventions

## Frontend (TypeScript/React)
- Strict TypeScript with noUnusedLocals/noUnusedParameters
- Path alias: @/* maps to src/*
- Components: default export, function components
- State: Zustand stores in stores/index.ts
- Shared constants: constants/index.ts (NODE_TYPES, LANGUAGES, DATABASES, etc.)
- Styling: Tailwind CSS classes, dark theme (bg-[#0a0a0f] base)
- cn() utility from lib/cn.ts for conditional classes

## Backend (Python)
- Hexagonal architecture: domain/ → ports/ → adapters/ → api/
- Ruff linter: line-length 120, target py313
- Type hints required
- Pydantic v2 for request/response schemas
- SQLAlchemy async models in adapters/persistence/

## Frontend Structure
- components/canvas/ — Canvas, FlowNode, Sidebar, TopBar, DeleteButton
- components/wizard/ — 6-step wizard flow
- components/chat/ — AI chat panel
- components/config/ — Node config panel, LLM settings modal, editors/
