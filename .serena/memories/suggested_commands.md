# Suggested Commands

## Run the app
docker compose up -d          # Start all services
docker compose restart frontend  # Restart frontend after changes

## Frontend
cd frontend && npx tsc -b         # TypeScript check
cd frontend && npx vite build     # Full production build
cd frontend && npx vite dev       # Local dev server (if not using Docker)

## Backend
cd backend && ruff check .        # Lint Python code
cd backend && ruff format .       # Format Python code
cd backend && pytest              # Run tests

## Docker
docker compose ps                 # Service status
docker compose logs -f api        # Follow API logs
docker compose logs -f frontend   # Follow frontend logs

## Git
git status
git diff
git log --oneline -10
