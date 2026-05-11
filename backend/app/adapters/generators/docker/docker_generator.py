"""Generate Dockerfile + docker-compose.yml for any supported stack."""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.domain.models.ir import IR
from app.domain.models.project import GeneratedFile

_TEMPLATE_DIR = Path(__file__).parent / "templates"

# (language, framework) → default app port
_PORT_MAP: dict[tuple[str, str], int] = {
    ("java", "spring"): 8080,
    ("python", "fastapi"): 8000,
    ("go", "gin"): 8080,
    ("typescript", "fastify"): 3000,
    ("typescript", "nestjs"): 3000,
    ("php", "symfony"): 8000,
}

# (language, framework) → extra env vars for the app service
_ENV_MAP: dict[tuple[str, str], dict[str, str]] = {
    ("java", "spring"): {"SERVER_PORT": "{app_port}"},
    ("python", "fastapi"): {"PORT": "{app_port}"},
    ("go", "gin"): {"PORT": "{app_port}"},
    ("typescript", "fastify"): {"PORT": "{app_port}"},
    ("typescript", "nestjs"): {"PORT": "{app_port}"},
    ("php", "symfony"): {"PORT": "{app_port}"},
}

_DB_PORT_MAP: dict[str, int] = {
    "postgres": 5432,
    "mysql": 3306,
}


def generate_docker_files(ir: IR) -> list[GeneratedFile]:
    """Render Dockerfile + docker-compose.yml from the IR and return as GeneratedFile list."""
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )

    lang = ir.language.lower()
    fw = ir.framework.lower()
    db = (ir.database or "").lower() or None

    app_port = _PORT_MAP.get((lang, fw), 8000)
    db_port = _DB_PORT_MAP.get(db, 5432) if db and db != "sqlite" else 5432

    # Build env vars for docker-compose
    base_env: dict[str, str] = {}
    if db and db != "sqlite":
        base_env.update({
            "DB_HOST": "db",
            "DB_PORT": str(db_port),
            "DB_NAME": "app",
            "DB_USER": "app",
            "DB_PASSWORD": "app",
        })

    # Add framework-specific env vars
    extra = _ENV_MAP.get((lang, fw), {})
    for k, v in extra.items():
        base_env[k] = v.format(app_port=app_port)

    pm = (ir.package_manager or "").lower()

    context = {
        "language": lang,
        "framework": fw,
        "database": db,
        "package_manager": pm,
        "app_port": app_port,
        "db_port": db_port,
        "env_vars": base_env,
    }

    dockerfile = env.get_template("Dockerfile.j2").render(**context)
    compose = env.get_template("docker-compose.yml.j2").render(**context)

    return [
        GeneratedFile(path="Dockerfile", content=dockerfile),
        GeneratedFile(path="docker-compose.yml", content=compose),
    ]
