/** FlowForge constants — shared data arrays for wizard, sidebar, and config. */

import type { Language, Architecture, NodeType, LLMProvider } from '@/types';

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
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
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
  entity: { tableName: '', fields: [{ name: 'id', type: 'integer', primary: true }] },
  response: { status: 200, type: 'json', description: '' },
  middleware: { type: 'auth', description: '' },
  service: { name: '', methods: [], description: '' },
  repository: { entity: '', methods: ['findAll', 'findById', 'save', 'delete'] },
  event: { name: '', payload: '', async: true },
};
