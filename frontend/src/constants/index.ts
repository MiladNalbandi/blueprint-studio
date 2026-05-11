/** FlowForge constants — shared data arrays for wizard, sidebar, and config. */

import type { Language, Architecture, NodeType, LLMProvider, Dependency } from '@/types';

// ─── Languages & Frameworks ─────────────────────────────

export interface LanguageDef {
  id: Language;
  name: string;
  icon: string;
  color: string;
  frameworks: Array<{ id: string; name: string; icon: string }>;
}

export const LANGUAGES: LanguageDef[] = [
  {
    id: 'php', name: 'PHP', icon: '🐘', color: '#7b7fb5',
    frameworks: [
      { id: 'laravel', name: 'Laravel', icon: '🔴' },
      { id: 'symfony', name: 'Symfony', icon: '⚫' },
      { id: 'slim', name: 'Slim', icon: '🟢' },
    ],
  },
  {
    id: 'typescript', name: 'TypeScript', icon: '🔷', color: '#3178c6',
    frameworks: [
      { id: 'nestjs', name: 'NestJS', icon: '🐈' },
      { id: 'express', name: 'Express', icon: '⚡' },
      { id: 'fastify', name: 'Fastify', icon: '🚀' },
    ],
  },
  {
    id: 'go', name: 'Go', icon: '🐹', color: '#00add8',
    frameworks: [
      { id: 'gin', name: 'Gin', icon: '🍸' },
      { id: 'echo', name: 'Echo', icon: '📣' },
      { id: 'fiber', name: 'Fiber', icon: '🔗' },
    ],
  },
  {
    id: 'python', name: 'Python', icon: '🐍', color: '#3776ab',
    frameworks: [
      { id: 'fastapi', name: 'FastAPI', icon: '⚡' },
      { id: 'django', name: 'Django', icon: '🎸' },
      { id: 'flask', name: 'Flask', icon: '🧪' },
    ],
  },
  {
    id: 'java', name: 'Java', icon: '☕', color: '#f89820',
    frameworks: [
      { id: 'spring', name: 'Spring Boot', icon: '🌱' },
      { id: 'quarkus', name: 'Quarkus', icon: '🔵' },
      { id: 'micronaut', name: 'Micronaut', icon: '🔬' },
    ],
  },
  {
    id: 'rust', name: 'Rust', icon: '🦀', color: '#dea584',
    frameworks: [
      { id: 'actix', name: 'Actix Web', icon: '🎭' },
      { id: 'axum', name: 'Axum', icon: '🔶' },
      { id: 'rocket', name: 'Rocket', icon: '🚀' },
    ],
  },
];

// ─── Databases ──────────────────────────────────────────

export interface DatabaseDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const DATABASES: DatabaseDef[] = [
  { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', color: '#336791', description: 'Advanced relational database' },
  { id: 'mysql', name: 'MySQL', icon: '🐬', color: '#4479a1', description: 'Popular relational database' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃', color: '#47a248', description: 'Document-oriented NoSQL' },
  { id: 'redis', name: 'Redis', icon: '🔴', color: '#dc382d', description: 'In-memory data store' },
  { id: 'sqlite', name: 'SQLite', icon: '📄', color: '#003b57', description: 'Embedded SQL database' },
  { id: 'none', name: 'Skip', icon: '⏭️', color: '#64748b', description: 'No database needed' },
];

// ─── ORM Mapping ────────────────────────────────────────

export const ORM_MAP: Record<Language, Array<{ id: string; name: string; icon: string }>> = {
  php: [
    { id: 'eloquent', name: 'Eloquent', icon: '🔴' },
    { id: 'doctrine', name: 'Doctrine', icon: '⚫' },
  ],
  typescript: [
    { id: 'prisma', name: 'Prisma', icon: '🔺' },
    { id: 'typeorm', name: 'TypeORM', icon: '🟦' },
    { id: 'drizzle', name: 'Drizzle', icon: '💧' },
  ],
  go: [
    { id: 'gorm', name: 'GORM', icon: '🐹' },
    { id: 'ent', name: 'Ent', icon: '🔗' },
  ],
  python: [
    { id: 'sqlalchemy', name: 'SQLAlchemy', icon: '🧪' },
    { id: 'django-orm', name: 'Django ORM', icon: '🎸' },
    { id: 'tortoise', name: 'Tortoise', icon: '🐢' },
  ],
  java: [
    { id: 'hibernate', name: 'Hibernate', icon: '🌱' },
    { id: 'jpa', name: 'JPA', icon: '☕' },
  ],
  rust: [
    { id: 'diesel', name: 'Diesel', icon: '⛽' },
    { id: 'sea-orm', name: 'SeaORM', icon: '🌊' },
  ],
};

// ─── Package Managers ──────────────────────────────────

export interface PackageManagerDef {
  id: string;
  name: string;
  icon: string;
  configFile: string;
  lockFile: string;
  commands: {
    install: string;
    add: string;
    remove: string;
    run: string;
    build: string;
    test: string;
  };
}

export const PACKAGE_MANAGERS: Record<Language, PackageManagerDef[]> = {
  python: [
    {
      id: 'pip', name: 'pip', icon: '📦',
      configFile: 'requirements.txt', lockFile: '',
      commands: { install: 'pip install -r requirements.txt', add: 'pip install', remove: 'pip uninstall', run: 'python', build: 'python -m build', test: 'pytest' },
    },
    {
      id: 'poetry', name: 'Poetry', icon: '🎭',
      configFile: 'pyproject.toml', lockFile: 'poetry.lock',
      commands: { install: 'poetry install', add: 'poetry add', remove: 'poetry remove', run: 'poetry run', build: 'poetry build', test: 'poetry run pytest' },
    },
    {
      id: 'pipenv', name: 'Pipenv', icon: '🔧',
      configFile: 'Pipfile', lockFile: 'Pipfile.lock',
      commands: { install: 'pipenv install', add: 'pipenv install', remove: 'pipenv uninstall', run: 'pipenv run', build: 'pipenv run build', test: 'pipenv run pytest' },
    },
  ],
  typescript: [
    {
      id: 'npm', name: 'npm', icon: '📦',
      configFile: 'package.json', lockFile: 'package-lock.json',
      commands: { install: 'npm install', add: 'npm install', remove: 'npm uninstall', run: 'npm run', build: 'npm run build', test: 'npm test' },
    },
    {
      id: 'yarn', name: 'Yarn', icon: '🧶',
      configFile: 'package.json', lockFile: 'yarn.lock',
      commands: { install: 'yarn', add: 'yarn add', remove: 'yarn remove', run: 'yarn', build: 'yarn build', test: 'yarn test' },
    },
    {
      id: 'pnpm', name: 'pnpm', icon: '⚡',
      configFile: 'package.json', lockFile: 'pnpm-lock.yaml',
      commands: { install: 'pnpm install', add: 'pnpm add', remove: 'pnpm remove', run: 'pnpm', build: 'pnpm build', test: 'pnpm test' },
    },
  ],
  go: [
    {
      id: 'gomod', name: 'Go Modules', icon: '🐹',
      configFile: 'go.mod', lockFile: 'go.sum',
      commands: { install: 'go mod download', add: 'go get', remove: 'go mod tidy', run: 'go run .', build: 'go build .', test: 'go test ./...' },
    },
  ],
  php: [
    {
      id: 'composer', name: 'Composer', icon: '🎵',
      configFile: 'composer.json', lockFile: 'composer.lock',
      commands: { install: 'composer install', add: 'composer require', remove: 'composer remove', run: 'php', build: 'composer dump-autoload', test: 'php vendor/bin/phpunit' },
    },
  ],
  java: [
    {
      id: 'gradle', name: 'Gradle', icon: '🐘',
      configFile: 'build.gradle', lockFile: 'gradle.lockfile',
      commands: { install: './gradlew build', add: 'implementation', remove: '(edit build.gradle)', run: './gradlew bootRun', build: './gradlew build', test: './gradlew test' },
    },
    {
      id: 'maven', name: 'Maven', icon: '🪶',
      configFile: 'pom.xml', lockFile: '',
      commands: { install: 'mvn install', add: '(add to pom.xml)', remove: '(edit pom.xml)', run: 'mvn spring-boot:run', build: 'mvn package', test: 'mvn test' },
    },
  ],
  rust: [
    {
      id: 'cargo', name: 'Cargo', icon: '📦',
      configFile: 'Cargo.toml', lockFile: 'Cargo.lock',
      commands: { install: 'cargo build', add: 'cargo add', remove: 'cargo remove', run: 'cargo run', build: 'cargo build --release', test: 'cargo test' },
    },
  ],
};

// ─── Framework Default Dependencies ──────────────────────

export const FRAMEWORK_DEFAULT_DEPS: Record<string, Dependency[]> = {
  // Python
  fastapi: [
    { name: 'fastapi', version: '>=0.115.0', isDefault: true },
    { name: 'uvicorn[standard]', version: '>=0.32.0', isDefault: true },
    { name: 'pydantic', version: '>=2.10.0', isDefault: true },
  ],
  django: [
    { name: 'django', version: '>=5.1.0', isDefault: true },
    { name: 'djangorestframework', version: '>=3.15.0', isDefault: true },
  ],
  flask: [
    { name: 'flask', version: '>=3.1.0', isDefault: true },
    { name: 'flask-restful', version: '>=0.3.10', isDefault: true },
  ],
  // TypeScript
  nestjs: [
    { name: '@nestjs/common', version: '^10.3.0', isDefault: true },
    { name: '@nestjs/core', version: '^10.3.0', isDefault: true },
    { name: '@nestjs/platform-express', version: '^10.3.0', isDefault: true },
    { name: 'reflect-metadata', version: '^0.2.2', isDefault: true },
    { name: 'rxjs', version: '^7.8.1', isDefault: true },
    { name: 'typescript', version: '^5.5.0', dev: true, isDefault: true },
  ],
  express: [
    { name: 'express', version: '^4.21.0', isDefault: true },
    { name: 'typescript', version: '^5.5.0', dev: true, isDefault: true },
    { name: '@types/express', version: '^5.0.0', dev: true, isDefault: true },
  ],
  fastify: [
    { name: 'fastify', version: '^4.28.0', isDefault: true },
    { name: 'typescript', version: '^5.5.0', dev: true, isDefault: true },
    { name: 'tsx', version: '^4.16.0', dev: true, isDefault: true },
  ],
  // Go
  gin: [
    { name: 'github.com/gin-gonic/gin', version: 'v1.10.0', isDefault: true },
  ],
  echo: [
    { name: 'github.com/labstack/echo/v4', version: 'v4.12.0', isDefault: true },
  ],
  fiber: [
    { name: 'github.com/gofiber/fiber/v2', version: 'v2.52.0', isDefault: true },
  ],
  // PHP
  laravel: [
    { name: 'laravel/framework', version: '^11.0', isDefault: true },
  ],
  symfony: [
    { name: 'symfony/framework-bundle', version: '^7.1', isDefault: true },
    { name: 'symfony/orm-pack', version: '^2.4', isDefault: true },
  ],
  slim: [
    { name: 'slim/slim', version: '^4.14', isDefault: true },
    { name: 'slim/psr7', version: '^1.7', isDefault: true },
  ],
  // Java
  spring: [
    { name: 'org.springframework.boot:spring-boot-starter-web', version: '3.3.0', isDefault: true },
    { name: 'org.springframework.boot:spring-boot-starter-data-jpa', version: '3.3.0', isDefault: true },
  ],
  quarkus: [
    { name: 'io.quarkus:quarkus-resteasy-reactive', version: '3.14.0', isDefault: true },
    { name: 'io.quarkus:quarkus-hibernate-orm-panache', version: '3.14.0', isDefault: true },
  ],
  micronaut: [
    { name: 'io.micronaut:micronaut-http-server-netty', version: '4.6.0', isDefault: true },
    { name: 'io.micronaut.data:micronaut-data-jpa', version: '4.8.0', isDefault: true },
  ],
  // Rust
  actix: [
    { name: 'actix-web', version: '4', isDefault: true },
    { name: 'serde', version: '1', isDefault: true },
    { name: 'serde_json', version: '1', isDefault: true },
  ],
  axum: [
    { name: 'axum', version: '0.7', isDefault: true },
    { name: 'tokio', version: '1', isDefault: true },
    { name: 'serde', version: '1', isDefault: true },
  ],
  rocket: [
    { name: 'rocket', version: '0.5', isDefault: true },
    { name: 'serde', version: '1', isDefault: true },
  ],
};

// ─── Architectures ──────────────────────────────────────

export interface ArchitectureDef {
  id: Architecture;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const ARCHITECTURES: ArchitectureDef[] = [
  { id: 'mvc', name: 'MVC', icon: '🏗️', color: '#3b82f6', description: 'Model-View-Controller pattern' },
  { id: 'ddd', name: 'DDD', icon: '🎯', color: '#8b5cf6', description: 'Domain-Driven Design' },
  { id: 'hexagonal', name: 'Hexagonal', icon: '⬡', color: '#10b981', description: 'Ports & Adapters architecture' },
  { id: 'clean', name: 'Clean', icon: '🧹', color: '#f59e0b', description: 'Clean Architecture by Uncle Bob' },
  { id: 'cqrs', name: 'CQRS', icon: '🔀', color: '#ef4444', description: 'Command Query Responsibility Segregation' },
  { id: 'microservice', name: 'Microservice', icon: '🧩', color: '#06b6d4', description: 'Distributed microservices' },
];

// ─── LLM Providers ──────────────────────────────────────

export interface LLMProviderDef {
  id: LLMProvider;
  name: string;
  icon: string;
  color: string;
  models: Array<{ id: string; name: string }>;
  defaultBaseUrl: string;
}

export const LLM_PROVIDERS: LLMProviderDef[] = [
  {
    id: 'claude', name: 'Claude', icon: '🟤', color: '#d4a574',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-4-5-20250414', name: 'Claude 4.5 Haiku' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
    defaultBaseUrl: 'https://api.anthropic.com',
  },
  {
    id: 'openai', name: 'OpenAI', icon: '🟢', color: '#10a37f',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o1', name: 'o1' },
    ],
    defaultBaseUrl: 'https://api.openai.com',
  },
  {
    id: 'gemini', name: 'Gemini', icon: '🔵', color: '#4285f4',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
  },
];

// ─── Node Types (shared with Sidebar, Canvas, Chat) ─────

export interface NodeTypeDef {
  type: NodeType;
  name: string;
  icon: string;
  color: string;
  category: string;
  desc: string;
}

export const NODE_TYPES: NodeTypeDef[] = [
  { type: 'endpoint', name: 'Endpoint', icon: '⚡', color: '#3b82f6', category: 'API', desc: 'HTTP route handler' },
  { type: 'dto', name: 'DTO', icon: '📦', color: '#8b5cf6', category: 'Data Flow', desc: 'Data transfer object' },
  { type: 'validator', name: 'Validator', icon: '✅', color: '#10b981', category: 'Data Flow', desc: 'Input validation' },
  { type: 'logic', name: 'Logic Block', icon: '🧠', color: '#f59e0b', category: 'Logic', desc: 'Conditional branching' },
  { type: 'entity', name: 'DB Entity', icon: '🗄️', color: '#06b6d4', category: 'Database', desc: 'Database model' },
  { type: 'response', name: 'Response', icon: '📤', color: '#ef4444', category: 'API', desc: 'API response' },
  { type: 'middleware', name: 'Middleware', icon: '🔗', color: '#ec4899', category: 'API', desc: 'Request middleware' },
  { type: 'service', name: 'Service', icon: '⚙️', color: '#f97316', category: 'Logic', desc: 'Business logic' },
  { type: 'repository', name: 'Repository', icon: '📚', color: '#14b8a6', category: 'Database', desc: 'Data access layer' },
  { type: 'event', name: 'Event', icon: '📡', color: '#a855f7', category: 'Logic', desc: 'Domain event' },
];

// ─── Default Node Configs ───────────────────────────────

export const DEFAULT_NODE_CONFIGS: Record<NodeType, Record<string, unknown>> = {
  endpoint: { method: 'GET', path: '/api/', description: '' },
  dto: { fields: [{ name: 'id', type: 'int' }], description: '' },
  validator: { rules: [{ field: '', rule: 'required' }], onFail: '422' },
  logic: { condition: '', outputs: 2, description: '' },
  entity: { tableName: '', fields: [{ name: 'id', type: 'integer', primary: true }], relations: [], indexes: [] },
  response: { status: 200, type: 'json', description: '' },
  middleware: { type: 'auth', description: '' },
  service: { name: '', methods: [], description: '' },
  repository: { entity: '', methods: ['findAll', 'findById', 'save', 'delete'] },
  event: { name: '', payload: '', async: true },
};
