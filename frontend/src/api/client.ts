/** API client for FlowForge backend. */

import axios from 'axios';
import type { Project, ProjectConfig, LLMConfig, GeneratedFile, ChatMessage } from '@/types';

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
    api.post<{ files: GeneratedFile[] }>(`/projects/${projectId}/generate/preview`).then((r) => r.data),
};

// ─── Chat ───────────────────────────────────────────────

export const chatApi = {
  send: (projectId: string, message: string, history: ChatMessage[]) =>
    api.post<{ reply: string; nodes_created: unknown | null }>(`/projects/${projectId}/chat`, {
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    }).then((r) => r.data),
};

// ─── WebSocket for streaming chat ───────────────────────

export function createChatWebSocket(projectId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/projects/${projectId}/chat/ws`);
  return ws;
}

export default api;
