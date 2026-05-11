/** Zustand store for Code Preview panel state. */

import { create } from 'zustand';
import type { GeneratedFile } from '@/types';
import { generateApi } from '@/api/client';

type GenerationPhase = 'idle' | 'converting' | 'generating' | 'done' | 'error';
type ErrorType = 'missing-llm-config' | 'llm-failure' | 'parse-error' | 'empty-flow' | 'generic' | null;

interface RunnerStatus {
  running: boolean;
  port: number | null;
  error: string | null;
}

interface CodePreviewState {
  files: GeneratedFile[];
  selectedFile: string | null;
  isGenerating: boolean;
  generateError: string | null;
  generatedBy: 'template' | 'llm' | null;
  generationPhase: GenerationPhase;
  errorType: ErrorType;
  logs: string[];
  runner: RunnerStatus;
  activeBottomTab: 'terminal' | 'endpoints';
  logSocket: WebSocket | null;

  // Actions
  generatePreview: (projectId: string) => Promise<void>;
  selectFile: (path: string | null) => void;
  startRunner: (projectId: string) => Promise<void>;
  stopRunner: (projectId: string) => Promise<void>;
  connectLogs: (projectId: string) => void;
  disconnectLogs: () => void;
  addLog: (line: string) => void;
  clearLogs: () => void;
  setActiveBottomTab: (tab: 'terminal' | 'endpoints') => void;
  reset: () => void;
}

function classifyError(detail: string, status?: number): ErrorType {
  if (detail.includes('Configure an LLM')) return 'missing-llm-config';
  if (detail.includes('Flow graph is empty')) return 'empty-flow';
  if (detail.includes('parse LLM output')) return 'parse-error';
  if (status === 502 || detail.includes('LLM generation failed')) return 'llm-failure';
  return 'generic';
}

// Module-level timer for phase simulation (single store instance)
let phaseTimer: ReturnType<typeof setTimeout> | null = null;

function clearPhaseTimer() {
  if (phaseTimer !== null) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
}

export const useCodePreviewStore = create<CodePreviewState>((set, get) => ({
  files: [],
  selectedFile: null,
  isGenerating: false,
  generateError: null,
  generatedBy: null,
  generationPhase: 'idle',
  errorType: null,
  logs: [],
  runner: { running: false, port: null, error: null },
  activeBottomTab: 'terminal',
  logSocket: null,

  generatePreview: async (projectId: string) => {
    clearPhaseTimer();
    set({
      isGenerating: true,
      generateError: null,
      generatedBy: null,
      generationPhase: 'converting',
      errorType: null,
      files: [],
      selectedFile: null,
    });

    // Simulate phase transition after 600ms
    phaseTimer = setTimeout(() => {
      if (get().isGenerating) {
        set({ generationPhase: 'generating' });
      }
    }, 600);

    try {
      const data = await generateApi.preview(projectId);
      clearPhaseTimer();
      const files = data.files || [];
      set({
        files,
        isGenerating: false,
        selectedFile: files.length > 0 ? files[0].path : null,
        generateError: data.warning || null,
        generatedBy: data.generated_by === 'llm' ? 'llm' : 'template',
        generationPhase: 'done',
        errorType: null,
      });
    } catch (err: unknown) {
      clearPhaseTimer();
      let message = 'Generation failed';
      let status: number | undefined;
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        message = axiosErr.response?.data?.detail || message;
        status = axiosErr.response?.status;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({
        isGenerating: false,
        generateError: message,
        generationPhase: 'error',
        errorType: classifyError(message, status),
      });
    }
  },

  selectFile: (path) => set({ selectedFile: path }),

  startRunner: async (projectId: string) => {
    set({ runner: { running: false, port: null, error: null }, logs: ['> Starting runner...'] });
    try {
      const res = await fetch(`/api/projects/${projectId}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        set({ runner: { running: false, port: null, error: data.detail || 'Failed to start' } });
        return;
      }
      set({ runner: { running: true, port: data.port, error: null } });
      get().connectLogs(projectId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start runner';
      set({ runner: { running: false, port: null, error: message } });
    }
  },

  stopRunner: async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/run`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    get().disconnectLogs();
    set({ runner: { running: false, port: null, error: null } });
  },

  connectLogs: (projectId: string) => {
    get().disconnectLogs();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/projects/${projectId}/run/logs`);
    ws.onmessage = (event) => {
      get().addLog(event.data);
    };
    ws.onerror = () => {
      get().addLog('[ERROR] WebSocket connection failed — check browser console');
    };
    ws.onclose = () => {
      set({ logSocket: null });
    };
    set({ logSocket: ws });
  },

  disconnectLogs: () => {
    const ws = get().logSocket;
    if (ws) {
      ws.close();
      set({ logSocket: null });
    }
  },

  addLog: (line: string) => {
    set((state) => ({ logs: [...state.logs, line] }));
  },

  clearLogs: () => set({ logs: [] }),

  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),

  reset: () => {
    clearPhaseTimer();
    get().disconnectLogs();
    set({
      files: [],
      selectedFile: null,
      isGenerating: false,
      generateError: null,
      generatedBy: null,
      generationPhase: 'idle',
      errorType: null,
      logs: [],
      runner: { running: false, port: null, error: null },
      activeBottomTab: 'terminal',
    });
  },
}));
