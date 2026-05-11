/** Zustand store for Function Builder state. */

import { create } from 'zustand';
import type { FunctionDefinition, FunctionRevision } from '@/types';
import { functionsApi } from '@/api/client';

interface FunctionState {
  // Data
  functions: Record<string, FunctionDefinition[]>;  // keyed by node_id
  activeFunction: FunctionDefinition | null;
  revisions: FunctionRevision[];

  // UI state
  isGenerating: boolean;
  generationError: string | null;

  // Actions
  loadFunctions: (projectId: string, nodeId: string) => Promise<void>;
  loadFunction: (projectId: string, functionId: string) => Promise<void>;
  loadRevisions: (projectId: string, functionId: string) => Promise<void>;
  createFunction: (projectId: string, nodeId: string, name: string, params?: { name: string; type: string }[], returnType?: string) => Promise<FunctionDefinition>;
  updateFunction: (projectId: string, functionId: string, data: Partial<FunctionDefinition>) => Promise<void>;
  deleteFunction: (projectId: string, functionId: string, nodeId: string) => Promise<void>;
  generateCode: (projectId: string, functionId: string, prompt: string, provider?: string, referencedNodeIds?: string[]) => Promise<void>;
  restoreRevision: (projectId: string, functionId: string, revisionId: string) => Promise<void>;
  batchSetFunctions: (nodeId: string, funcs: FunctionDefinition[]) => void;
  setActiveFunction: (func: FunctionDefinition | null) => void;
  clearError: () => void;
}

export const useFunctionStore = create<FunctionState>((set) => ({
  functions: {},
  activeFunction: null,
  revisions: [],
  isGenerating: false,
  generationError: null,

  loadFunctions: async (projectId, nodeId) => {
    const funcs = await functionsApi.list(projectId, nodeId);
    set((state) => ({
      functions: { ...state.functions, [nodeId]: funcs },
    }));
  },

  loadFunction: async (projectId, functionId) => {
    const func = await functionsApi.get(projectId, functionId);
    set({ activeFunction: func });
  },

  loadRevisions: async (projectId, functionId) => {
    const revisions = await functionsApi.getRevisions(projectId, functionId);
    set({ revisions });
  },

  createFunction: async (projectId, nodeId, name, params, returnType) => {
    const func = await functionsApi.create(projectId, {
      node_id: nodeId,
      name,
      params: params?.map((p) => ({ ...p, default_value: null })),
      return_type: returnType || 'void',
    });
    set((state) => ({
      functions: {
        ...state.functions,
        [nodeId]: [...(state.functions[nodeId] || []), func],
      },
    }));
    return func;
  },

  updateFunction: async (projectId, functionId, data) => {
    const updated = await functionsApi.update(projectId, functionId, data);
    const nodeId = updated.node_id;
    set((state) => ({
      activeFunction: state.activeFunction?.id === functionId ? updated : state.activeFunction,
      functions: {
        ...state.functions,
        [nodeId]: (state.functions[nodeId] || []).map((f) => f.id === functionId ? updated : f),
      },
    }));
  },

  deleteFunction: async (projectId, functionId, nodeId) => {
    await functionsApi.delete(projectId, functionId);
    set((state) => ({
      activeFunction: state.activeFunction?.id === functionId ? null : state.activeFunction,
      functions: {
        ...state.functions,
        [nodeId]: (state.functions[nodeId] || []).filter((f) => f.id !== functionId),
      },
    }));
  },

  generateCode: async (projectId, functionId, prompt, provider, referencedNodeIds) => {
    set({ isGenerating: true, generationError: null });
    try {
      const result = await functionsApi.generate(projectId, functionId, prompt, provider, referencedNodeIds);
      const nodeId = result.function.node_id;
      set((state) => ({
        activeFunction: result.function,
        revisions: [...state.revisions, result.revision],
        functions: {
          ...state.functions,
          [nodeId]: (state.functions[nodeId] || []).map((f) => f.id === functionId ? result.function : f),
        },
        isGenerating: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      set({ isGenerating: false, generationError: message });
    }
  },

  restoreRevision: async (projectId, functionId, revisionId) => {
    const updated = await functionsApi.restoreRevision(projectId, functionId, revisionId);
    const nodeId = updated.node_id;
    // Reload revisions to get the new restore revision
    const revisions = await functionsApi.getRevisions(projectId, functionId);
    set((state) => ({
      activeFunction: updated,
      revisions,
      functions: {
        ...state.functions,
        [nodeId]: (state.functions[nodeId] || []).map((f) => f.id === functionId ? updated : f),
      },
    }));
  },

  batchSetFunctions: (nodeId, funcs) => {
    set((state) => ({
      functions: {
        ...state.functions,
        [nodeId]: [...(state.functions[nodeId] || []), ...funcs],
      },
    }));
  },

  setActiveFunction: (func) => set({ activeFunction: func, revisions: [] }),
  clearError: () => set({ generationError: null }),
}));
