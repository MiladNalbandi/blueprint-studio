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
  package_manager: string | null;
}

export interface Dependency {
  name: string;
  version: string;
  dev?: boolean;
  isDefault?: boolean;
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

export interface GeneratePreviewResponse {
  files: GeneratedFile[];
  generated_by?: 'llm';
  warning?: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id?: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  nodes_created?: {
    nodes?: Array<{ tempId: string; type: NodeType; label: string; config: Record<string, unknown> }>;
    edges?: Array<{ from: string; to: string }>;
    edits?: Array<{ nodeId: string; label?: string; config?: Record<string, unknown> }>;
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
  packageManager: string | null;
  database: string | null;
  orm: string | null;
  architecture: Architecture | null;
  llmProviders: Record<string, LLMWizardConfig>;
}

// ─── Inline Function Defs (from AI chat) ────────────────

export interface InlineFunctionDef {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  code: string;
  description: string;
}

// ─── Function Builder Types ─────────────────────────────

export interface FunctionParam {
  name: string;
  type: string;
  default_value?: string | null;
}

export interface FunctionRevision {
  id: string;
  function_id: string;
  revision_number: number;
  code: string;
  prompt: string;
  provider: string;
  model: string;
  diff_from_previous: string | null;
  created_at: string;
}

export interface FunctionDefinition {
  id: string;
  project_id: string;
  node_id: string;
  name: string;
  description: string;
  params: FunctionParam[];
  return_type: string;
  current_code: string;
  current_prompt: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}
