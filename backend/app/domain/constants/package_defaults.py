"""Default dependencies per framework, plus DB/ORM extras."""

from __future__ import annotations

from app.domain.models.project import ProjectConfig


# ─── Framework default deps ──────────────────────────────

FRAMEWORK_DEFAULTS: dict[str, list[dict]] = {
    # Python
    "fastapi": [
        {"name": "fastapi", "version": ">=0.115.0"},
        {"name": "uvicorn[standard]", "version": ">=0.32.0"},
        {"name": "pydantic", "version": ">=2.10.0"},
    ],
    "django": [
        {"name": "django", "version": ">=5.1.0"},
        {"name": "djangorestframework", "version": ">=3.15.0"},
    ],
    "flask": [
        {"name": "flask", "version": ">=3.1.0"},
        {"name": "flask-restful", "version": ">=0.3.10"},
    ],
    # TypeScript
    "nestjs": [
        {"name": "@nestjs/common", "version": "^10.3.0"},
        {"name": "@nestjs/core", "version": "^10.3.0"},
        {"name": "@nestjs/platform-express", "version": "^10.3.0"},
        {"name": "reflect-metadata", "version": "^0.2.2"},
        {"name": "rxjs", "version": "^7.8.1"},
        {"name": "class-transformer", "version": "^0.5.1"},
        {"name": "class-validator", "version": "^0.14.1"},
        {"name": "typescript", "version": "^5.5.0", "dev": True},
        {"name": "@nestjs/cli", "version": "^10.3.0", "dev": True},
        {"name": "@types/node", "version": "^22.0.0", "dev": True},
    ],
    "express": [
        {"name": "express", "version": "^4.21.0"},
        {"name": "typescript", "version": "^5.5.0", "dev": True},
        {"name": "@types/express", "version": "^5.0.0", "dev": True},
        {"name": "@types/node", "version": "^22.0.0", "dev": True},
    ],
    "fastify": [
        {"name": "fastify", "version": "^4.28.0"},
        {"name": "typescript", "version": "^5.5.0", "dev": True},
        {"name": "tsx", "version": "^4.16.0", "dev": True},
        {"name": "@types/node", "version": "^22.0.0", "dev": True},
    ],
    # Go
    "gin": [
        {"name": "github.com/gin-gonic/gin", "version": "v1.10.0"},
    ],
    "echo": [
        {"name": "github.com/labstack/echo/v4", "version": "v4.12.0"},
    ],
    "fiber": [
        {"name": "github.com/gofiber/fiber/v2", "version": "v2.52.0"},
    ],
    # PHP
    "laravel": [
        {"name": "laravel/framework", "version": "^11.0"},
    ],
    "symfony": [
        {"name": "symfony/framework-bundle", "version": "^7.1"},
        {"name": "symfony/orm-pack", "version": "^2.4"},
    ],
    "slim": [
        {"name": "slim/slim", "version": "^4.14"},
        {"name": "slim/psr7", "version": "^1.7"},
    ],
    # Java
    "spring": [
        {"name": "org.springframework.boot:spring-boot-starter-web", "version": "3.3.0"},
        {"name": "org.springframework.boot:spring-boot-starter-data-jpa", "version": "3.3.0"},
    ],
    "quarkus": [
        {"name": "io.quarkus:quarkus-resteasy-reactive", "version": "3.14.0"},
        {"name": "io.quarkus:quarkus-hibernate-orm-panache", "version": "3.14.0"},
    ],
    "micronaut": [
        {"name": "io.micronaut:micronaut-http-server-netty", "version": "4.6.0"},
        {"name": "io.micronaut.data:micronaut-data-jpa", "version": "4.8.0"},
    ],
    # Rust
    "actix": [
        {"name": "actix-web", "version": "4"},
        {"name": "serde", "version": "1"},
        {"name": "serde_json", "version": "1"},
    ],
    "axum": [
        {"name": "axum", "version": "0.7"},
        {"name": "tokio", "version": "1"},
        {"name": "serde", "version": "1"},
    ],
    "rocket": [
        {"name": "rocket", "version": "0.5"},
        {"name": "serde", "version": "1"},
    ],
}


# ─── Database driver extras ──────────────────────────────

DATABASE_EXTRAS: dict[str, dict[str, list[dict]]] = {
    "python": {
        "postgresql": [{"name": "asyncpg", "version": ">=0.30.0"}],
        "mysql": [{"name": "aiomysql", "version": ">=0.2.0"}],
        "sqlite": [{"name": "aiosqlite", "version": ">=0.20.0"}],
    },
    "typescript": {
        "postgresql": [{"name": "pg", "version": "^8.12.0"}],
        "mysql": [{"name": "mysql2", "version": "^3.10.0"}],
        "sqlite": [{"name": "better-sqlite3", "version": "^11.0.0"}],
    },
    "go": {
        "postgresql": [{"name": "gorm.io/driver/postgres", "version": "v1.5.11"}],
        "mysql": [{"name": "gorm.io/driver/mysql", "version": "v1.5.7"}],
        "sqlite": [{"name": "gorm.io/driver/sqlite", "version": "v1.5.6"}],
    },
    "php": {
        "postgresql": [{"name": "doctrine/dbal", "version": "^4.0"}],
        "mysql": [{"name": "doctrine/dbal", "version": "^4.0"}],
    },
}


# ─── ORM extras ──────────────────────────────────────────

ORM_EXTRAS: dict[str, dict[str, list[dict]]] = {
    "python": {
        "sqlalchemy": [{"name": "sqlalchemy", "version": ">=2.0.0"}],
        "tortoise": [{"name": "tortoise-orm", "version": ">=0.21.0"}],
    },
    "typescript": {
        "typeorm": [{"name": "typeorm", "version": "^0.3.20"}],
        "prisma": [{"name": "prisma", "version": "^5.20.0", "dev": True}, {"name": "@prisma/client", "version": "^5.20.0"}],
        "drizzle": [{"name": "drizzle-orm", "version": "^0.33.0"}, {"name": "drizzle-kit", "version": "^0.24.0", "dev": True}],
    },
    "go": {
        "gorm": [{"name": "gorm.io/gorm", "version": "v1.25.12"}],
        "ent": [{"name": "entgo.io/ent", "version": "v0.14.0"}],
    },
}


def resolve_dependencies(config: ProjectConfig) -> list[dict]:
    """Merge framework defaults + DB extras + ORM extras into a single dep list."""
    seen: set[str] = set()
    deps: list[dict] = []

    def _add(items: list[dict]):
        for d in items:
            if d["name"] not in seen:
                seen.add(d["name"])
                deps.append({**d, "isDefault": True})

    # Framework defaults
    _add(FRAMEWORK_DEFAULTS.get(config.framework.lower(), []))

    # Database driver extras
    lang = config.language.value
    db = (config.database or "").lower()
    if db:
        _add(DATABASE_EXTRAS.get(lang, {}).get(db, []))

    # ORM extras
    orm = (config.orm or "").lower()
    if orm:
        _add(ORM_EXTRAS.get(lang, {}).get(orm, []))

    return deps
