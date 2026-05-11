/** API client for FlowForge backend. */

import axios from 'axios';
import type { Project, ProjectConfig, LLMConfig, GeneratePreviewResponse, ChatMessage, ChatSession, FunctionDefinition, FunctionRevision, FunctionParam } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Projects ───────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),

  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (name: string, config: ProjectConfig) =>
    api.post<Project>('/projects', { name, config }).then((r) => r.data),

  update: (id: string, data: { name?: string; config?: ProjectConfig }) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

// ─── Flows ──────────────────────────────────────────────

export const flowsApi = {
  get: (projectId: string) =>
    api.get(`/projects/${projectId}/flow`).then((r) => r.data),

  save: (projectId: string, flow: { nodes: unknown[]; edges: unknown[]; viewport: unknown }) =>
    api.put(`/projects/${projectId}/flow`, { flow }).then((r) => r.data),
};

// ─── LLM Config ─────────────────────────────────────────

export const llmApi = {
  list: (projectId: string) =>
    api.get<LLMConfig[]>(`/projects/${projectId}/llm-configs`).then((r) => r.data),

  create: (projectId: string, config: { provider: string; model: string; api_key: string; base_url?: string; temperature?: number }) =>
    api.post<LLMConfig>(`/projects/${projectId}/llm-configs`, config).then((r) => r.data),
};

// ─── Generation ─────────────────────────────────────────

export const generateApi = {
  generate: (projectId: string, provider: string = 'claude') =>
    api.post(`/projects/${projectId}/generate`, { provider }, { responseType: 'blob' }).then((r) => {
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'flowforge-generated.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),

  preview: (projectId: string) =>
    api.post<GeneratePreviewResponse>(`/projects/${projectId}/generate/preview`).then((r) => r.data),
};

// ─── Chat ───────────────────────────────────────────────

export const chatApi = {
  send: (projectId: string, message: string, history: ChatMessage[], referencedNodeIds?: string[], sessionId?: string) =>
    api.post<{ reply: string; nodes_created: unknown | null; session_id: string | null }>(`/projects/${projectId}/chat`, {
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      referenced_node_ids: referencedNodeIds?.length ? referencedNodeIds : undefined,
      session_id: sessionId || undefined,
    }).then((r) => r.data),

  listSessions: (projectId: string) =>
    api.get<ChatSession[]>(`/projects/${projectId}/chat/sessions`).then((r) => r.data),

  createSession: (projectId: string, title: string = 'New Chat') =>
    api.post<ChatSession>(`/projects/${projectId}/chat/sessions`, { title }).then((r) => r.data),

  deleteSession: (projectId: string, sessionId: string) =>
    api.delete(`/projects/${projectId}/chat/sessions/${sessionId}`),

  updateSessionTitle: (projectId: string, sessionId: string, title: string) =>
    api.patch<ChatSession>(`/projects/${projectId}/chat/sessions/${sessionId}`, { title }).then((r) => r.data),

  getMessages: (projectId: string, sessionId: string) =>
    api.get<ChatMessage[]>(`/projects/${projectId}/chat/sessions/${sessionId}/messages`).then((r) => r.data),
};

// ─── WebSocket for streaming chat ───────────────────────

export function createChatWebSocket(projectId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/projects/${projectId}/chat/ws`);
  return ws;
}

// ─── Functions ──────────────────────────────────────────

export const functionsApi = {
  list: (projectId: string, nodeId?: string) =>
    api.get<FunctionDefinition[]>(`/projects/${projectId}/functions`, {
      params: nodeId ? { node_id: nodeId } : {},
    }).then((r) => r.data),

  get: (projectId: string, functionId: string) =>
    api.get<FunctionDefinition>(`/projects/${projectId}/functions/${functionId}`).then((r) => r.data),

  create: (projectId: string, data: { node_id: string; name: string; description?: string; params?: FunctionParam[]; return_type?: string; current_code?: string; current_prompt?: string; is_ai_generated?: boolean }) =>
    api.post<FunctionDefinition>(`/projects/${projectId}/functions`, data).then((r) => r.data),

  update: (projectId: string, functionId: string, data: { name?: string; description?: string; params?: FunctionParam[]; return_type?: string; current_code?: string }) =>
    api.patch<FunctionDefinition>(`/projects/${projectId}/functions/${functionId}`, data).then((r) => r.data),

  delete: (projectId: string, functionId: string) =>
    api.delete(`/projects/${projectId}/functions/${functionId}`),

  generate: (projectId: string, functionId: string, prompt: string, provider?: string, referencedNodeIds?: string[]) =>
    api.post<{ function: FunctionDefinition; revision: FunctionRevision }>(`/projects/${projectId}/functions/${functionId}/generate`, {
      prompt,
      provider: provider || undefined,
      referenced_node_ids: referencedNodeIds?.length ? referencedNodeIds : undefined,
    }).then((r) => r.data),

  getRevisions: (projectId: string, functionId: string) =>
    api.get<FunctionRevision[]>(`/projects/${projectId}/functions/${functionId}/revisions`).then((r) => r.data),

  restoreRevision: (projectId: string, functionId: string, revisionId: string) =>
    api.post<FunctionDefinition>(`/projects/${projectId}/functions/${functionId}/revisions/${revisionId}/restore`).then((r) => r.data),
};

// ─── Templates ──────────────────────────────────────────

export const templatesApi = {
  list: () => api.get<Array<{ id: string; name: string; description: string; icon: string }>>('/templates').then((r) => r.data),

  get: (id: string) =>
    api.get<{ id: string; name: string; description: string; icon: string; nodes: Array<{ tempId: string; type: string; label: string; config: Record<string, unknown> }>; edges: Array<{ from: string; to: string }> }>(
      `/templates/${id}`,
    ).then((r) => r.data),
};

// ─── Import ─────────────────────────────────────────────

export const importApi = {
  openapi: (projectId: string, spec: Record<string, unknown>) =>
    api.post<{ nodes_created: { nodes: Array<{ tempId: string; type: string; label: string; config: Record<string, unknown> }>; edges: Array<{ from: string; to: string }> } }>(
      `/projects/${projectId}/import/openapi`,
      { spec },
    ).then((r) => r.data),
};

export default api;
