# Task Completion Checklist

After completing a task, verify:

1. **TypeScript**: `cd frontend && node_modules/.bin/tsc -b` — zero errors
2. **Vite build**: `cd frontend && node_modules/.bin/vite build` — builds successfully
3. **Python lint** (if backend changed): `cd backend && ruff check .`
4. **Test** (if backend changed): `cd backend && pytest`
5. **Docker**: `docker compose restart frontend` to pick up changes
