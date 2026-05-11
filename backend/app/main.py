from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.persistence.database import engine, create_tables
from app.api.routes import projects, flows, generate, chat, llm_config, functions, runner, templates, import_routes
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    settings = get_settings()
    if settings.is_dev:
        await create_tables()
    yield
    await engine.dispose()


app = FastAPI(
    title="FlowForge API",
    description="Visual code architecture builder — flow graph to clean code",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(flows.router, prefix="/api/projects", tags=["flows"])
app.include_router(generate.router, prefix="/api/projects", tags=["generate"])
app.include_router(chat.router, prefix="/api/projects", tags=["chat"])
app.include_router(llm_config.router, prefix="/api/projects", tags=["llm-config"])
app.include_router(functions.router, prefix="/api/projects", tags=["functions"])
app.include_router(runner.router, prefix="/api/projects", tags=["runner"])
app.include_router(templates.router, prefix="/api", tags=["templates"])
app.include_router(import_routes.router, prefix="/api/projects", tags=["import"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "flowforge"}
