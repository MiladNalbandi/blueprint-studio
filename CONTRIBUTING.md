# Contributing to Blueprint Studio

Thanks for your interest in contributing! This document covers how to set up your dev environment, our conventions, and how to extend the codebase.

## Dev setup

The [README](README.md#quick-start) has the full setup. Short version:

```bash
git clone https://github.com/MiladNalbandi/blueprint-studio.git
cd blueprint-studio
cp .env.example .env
docker compose up --build -d
docker compose exec api alembic upgrade head
```

Frontend and backend code are volume-mounted with hot-reload, so most changes appear live. If you change `pyproject.toml` or `package.json`, re-run `docker compose up --build -d` to install new deps.

## Type checking

```bash
cd frontend && npx tsc --noEmit       # TypeScript
```

Backend uses ruff (line-length 120). A formal `ruff check` script will be wired up; for now, please follow standard Python conventions.

## Branch & commit conventions

- Branch names: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- Commit messages follow the Conventional Commits–ish style already in `git log`:
  - `feat: add OpenAPI import modal`
  - `fix: prevent flow state loss on rapid edits`
  - `chore: bump react-flow`
  - `docs: clarify generator extension steps`

Keep commits focused. One logical change per commit makes review and `git bisect` painless.

## Pull requests

1. Fork & branch.
2. Make your change. Keep PRs small when you can.
3. Make sure `npx tsc --noEmit` passes for any frontend edit.
4. For backend changes, run `docker compose up --build -d` and exercise the affected endpoint.
5. Open the PR with a clear description of *why* (not just *what*).

## How to add a new code generator

See the section in the [README](README.md#extending). High-level:

1. Create `backend/app/adapters/generators/your_stack/`.
2. Add Jinja2 templates under `templates/`.
3. Implement a class extending `BaseGenerator`.
4. Register it in `backend/app/api/routes/generate.py` → `GENERATORS`.

The cleanest reference implementations are `python_fastapi` and `ts_nestjs`.

## How to add a new LLM provider

1. Create `backend/app/adapters/llm/your_provider_adapter.py`.
2. Implement `LLMProviderPort` (`chat` + `stream`).
3. Register it in `backend/app/adapters/llm/factory.py`.

See `claude_adapter.py` for a complete reference.

## Reporting bugs

Open an issue with:
- What you expected
- What actually happened
- Steps to reproduce (a screenshot of the canvas or a curl command is great)
- Your stack: OS, Docker version, browser

## Security issues

Please **don't** open a public issue for security problems. Use GitHub's "Report a vulnerability" option (Security tab → Advisories) instead.
