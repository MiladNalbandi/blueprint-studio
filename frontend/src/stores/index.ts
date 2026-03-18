/** Zustand stores for FlowForge state management. */

import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { Project, LLMConfig, ChatMessage, FlowNodeData } from '@/types';

// ─── Project Store ──────────────────────────────────────

interface ProjectState {
  project: Project | null;
  projects: Project[];
  setProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  projects: [],
  setProject: (project) => set({ project }),
  setProjects: (projects) => set({ projects }),
}));

// ─── Flow Store (React Flow state) ─────────────────────

interface FlowState {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node<FlowNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node<FlowNodeData>) => void;
  addNodes: (nodes: Node<FlowNodeData>[]) => void;
  addEdges: (edges: Edge[]) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  clear: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as Node<FlowNodeData>[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  addNodes: (nodes) => set((state) => ({ nodes: [...state.nodes, ...nodes] })),

  addEdges: (edges) => set((state) => ({
    edges: [...state.edges, ...edges.map((e, i) => ({
      ...e,
      id: e.id || `edge_${Date.now()}_${i}`,
    }))],
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  })),

  deleteEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== edgeId),
  })),

  updateNodeData: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    ),
  })),

  clear: () => set({ nodes: [], edges: [] }),
}));

// ─── LLM Config Store ──────────────────────────────────

interface LLMState {
  configs: LLMConfig[];
  setConfigs: (configs: LLMConfig[]) => void;
  addConfig: (config: LLMConfig) => void;
  updateConfig: (id: string, data: Partial<LLMConfig>) => void;
  removeConfig: (id: string) => void;
}

export const useLLMStore = create<LLMState>((set) => ({
  configs: [],
  setConfigs: (configs) => set({ configs }),
  addConfig: (config) => set((state) => ({ configs: [...state.configs, config] })),
  updateConfig: (id, data) => set((state) => ({
    configs: state.configs.map((c) => c.id === id ? { ...c, ...data } : c),
  })),
  removeConfig: (id) => set((state) => ({
    configs: state.configs.filter((c) => c.id !== id),
  })),
}));

// ─── Chat Store ─────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  setOpen: (isOpen) => set({ isOpen }),
  clear: () => set({ messages: [], isLoading: false }),
}));

// ─── UI Store ───────────────────────────────────────────

type Phase = 'wizard' | 'canvas';

interface UIState {
  phase: Phase;
  sidebarCollapsed: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  showConfigPanel: boolean;
  showLLMSettings: boolean;
  setPhase: (phase: Phase) => void;
  toggleSidebar: () => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setShowConfigPanel: (show: boolean) => void;
  setShowLLMSettings: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  phase: 'wizard',
  sidebarCollapsed: false,
  selectedNodeId: null,
  selectedEdgeId: null,
  showConfigPanel: false,
  showLLMSettings: false,
  setPhase: (phase) => set({ phase }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null, showConfigPanel: !!nodeId }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null, showConfigPanel: false }),
  setShowConfigPanel: (show) => set({ showConfigPanel: show }),
  setShowLLMSettings: (show) => set({ showLLMSettings: show }),
}));
