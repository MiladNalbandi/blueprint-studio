/** Core FlowForge types — shared between frontend and backend schemas. */

export type Language = 'php' | 'typescript' | 'go' | 'python' | 'java' | 'rust';
export type Architecture = 'ddd' | 'mvc' | 'hexagonal' | 'clean' | 'cqrs' | 'microservice';
export type NodeType = 'endpoint' | 'dto' | 'validator' | 'logic' | 'entity' | 'response' | 'middleware' | 'service' | 'repository' | 'event';
export type LLMProvider = 'claude' | 'openai' | 'gemini';

export interface ProjectConfig {
  language: Language;
  framework: string;
  database: string | null;
  orm: string | null;
  architecture: Architecture;
}

export interface Project {
  id: string;
  name: string;
  config: ProjectConfig;
  created_at: string;
  updated_at: string;
}

export interface FlowNodeData {
  [key: string]: unknown;
  label: string;
  nodeType: NodeType;
  config: Record<string, unknown>;
}

export interface LLMConfig {
  id: string;
  provider: LLMProvider;
  model: string;
  base_url: string | null;
  temperature: number;
  has_api_key: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  nodes_created?: {
    nodes: Array<{ tempId: string; type: NodeType; label: string; config: Record<string, unknown> }>;
    edges: Array<{ from: string; to: string }>;
  } | null;
}

// ─── Wizard Types ───────────────────────────────────────

export interface LLMWizardConfig {
  enabled: boolean;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  showKey: boolean;
}

export interface WizardData {
  name: string;
  language: Language | null;
  framework: string | null;
  database: string | null;
  orm: string | null;
  architecture: Architecture | null;
  llmProviders: Record<string, LLMWizardConfig>;
}
