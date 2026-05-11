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
import type { Project, LLMConfig, ChatMessage, ChatSession, FlowNodeData } from '@/types';
import { flowsApi, chatApi } from '@/api/client';
import { toBackendFlow } from '@/lib/flowTransform';

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
  dirty: boolean;
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
  markClean: () => void;
  clear: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  dirty: false,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as Node<FlowNodeData>[], dirty: true });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges), dirty: true });
  },

  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges), dirty: true });
  },

  // Data-loading setters — do NOT mark dirty
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // User-initiated mutations — mark dirty
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node], dirty: true })),

  addNodes: (nodes) => set((state) => ({ nodes: [...state.nodes, ...nodes], dirty: true })),

  addEdges: (edges) => set((state) => ({
    edges: [...state.edges, ...edges.map((e, i) => ({
      ...e,
      id: e.id || `edge_${Date.now()}_${i}`,
    }))],
    dirty: true,
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    dirty: true,
  })),

  deleteEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== edgeId),
    dirty: true,
  })),

  updateNodeData: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    ),
    dirty: true,
  })),

  markClean: () => set({ dirty: false }),
  clear: () => set({ nodes: [], edges: [], dirty: false }),
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
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setSessions: (sessions: ChatSession[]) => void;
  setActiveSessionId: (id: string | null) => void;
  loadSessions: (projectId: string) => Promise<void>;
  createSession: (projectId: string) => Promise<ChatSession>;
  selectSession: (projectId: string, sessionId: string) => Promise<void>;
  deleteSession: (projectId: string, sessionId: string) => Promise<void>;
  renameSession: (projectId: string, sessionId: string, title: string) => Promise<void>;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isLoading: false,
  isOpen: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  loadSessions: async (projectId: string) => {
    try {
      const sessions = await chatApi.listSessions(projectId);
      set({ sessions });
    } catch (err) {
      console.error('[Chat] Failed to load sessions:', err);
    }
  },

  createSession: async (projectId: string) => {
    const session = await chatApi.createSession(projectId);
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      messages: [],
    }));
    return session;
  },

  selectSession: async (projectId: string, sessionId: string) => {
    set({ activeSessionId: sessionId, messages: [], isLoading: true });
    try {
      const messages = await chatApi.getMessages(projectId, sessionId);
      set({ messages, isLoading: false });
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
      set({ isLoading: false });
    }
  },

  deleteSession: async (projectId: string, sessionId: string) => {
    try {
      await chatApi.deleteSession(projectId, sessionId);
      const state = get();
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      const updates: Partial<ChatState> = { sessions };
      if (state.activeSessionId === sessionId) {
        updates.activeSessionId = null;
        updates.messages = [];
      }
      set(updates);
    } catch (err) {
      console.error('[Chat] Failed to delete session:', err);
    }
  },

  renameSession: async (projectId: string, sessionId: string, title: string) => {
    try {
      const updated = await chatApi.updateSessionTitle(projectId, sessionId, title);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s)),
      }));
    } catch (err) {
      console.error('[Chat] Failed to rename session:', err);
    }
  },

  clear: () => set({ messages: [], isLoading: false, activeSessionId: null }),
}));

// ─── UI Store ───────────────────────────────────────────

export type Phase = 'dashboard' | 'wizard' | 'canvas';

function phasePathFor(phase: Phase, projectId?: string | null): string {
  switch (phase) {
    case 'wizard': return '/new';
    case 'canvas': return projectId ? `/canvas/${projectId}` : '/canvas';
    default: return '/';
  }
}

function phaseFromPath(path: string): Phase {
  if (path === '/new') return 'wizard';
  if (path.startsWith('/canvas')) return 'canvas';
  return 'dashboard';
}

function projectIdFromPath(path: string): string | null {
  const match = path.match(/^\/canvas\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

interface UIState {
  phase: Phase;
  sidebarCollapsed: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  showConfigPanel: boolean;
  showLLMSettings: boolean;
  showFunctionBuilder: boolean;
  activeFunctionBuilderId: string | null;
  showCodePreview: boolean;
  showDependencyPanel: boolean;
  /** Push a new history entry and update phase. */
  setPhase: (phase: Phase, projectId?: string | null) => void;
  /** Update phase from popstate (no history push). */
  _syncPhase: (phase: Phase) => void;
  /** Project ID extracted from URL on load. */
  pendingProjectId: string | null;
  toggleSidebar: () => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setShowConfigPanel: (show: boolean) => void;
  setShowLLMSettings: (show: boolean) => void;
  setShowFunctionBuilder: (show: boolean, functionId?: string | null) => void;
  setShowCodePreview: (show: boolean) => void;
  setShowDependencyPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  phase: phaseFromPath(window.location.pathname),
  sidebarCollapsed: false,
  selectedNodeId: null,
  selectedEdgeId: null,
  showConfigPanel: false,
  showLLMSettings: false,
  showFunctionBuilder: false,
  activeFunctionBuilderId: null,
  showCodePreview: false,
  showDependencyPanel: false,
  pendingProjectId: projectIdFromPath(window.location.pathname),
  setPhase: (phase, projectId = null) => {
    const path = phasePathFor(phase, projectId);
    window.history.pushState({ phase }, '', path);
    set({ phase, pendingProjectId: null });
  },
  _syncPhase: (phase) => set({ phase }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null, showConfigPanel: !!nodeId }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null, showConfigPanel: false }),
  setShowConfigPanel: (show) => set({ showConfigPanel: show }),
  setShowLLMSettings: (show) => set({ showLLMSettings: show }),
  setShowFunctionBuilder: (show, functionId = null) => set({ showFunctionBuilder: show, activeFunctionBuilderId: functionId }),
  setShowCodePreview: (show) => set({ showCodePreview: show }),
  setShowDependencyPanel: (show) => set({ showDependencyPanel: show }),
}));

// Seed initial history state so the first back press works
window.history.replaceState(
  { phase: phaseFromPath(window.location.pathname) },
  '',
);

// Listen for browser back/forward
window.addEventListener('popstate', (event) => {
  const prevPhase = useUIStore.getState().phase;
  const nextPhase: Phase = event.state?.phase ?? phaseFromPath(window.location.pathname);

  // Save flow when navigating away from canvas via browser back/forward
  if (prevPhase === 'canvas' && nextPhase !== 'canvas') {
    const project = useProjectStore.getState().project;
    const { nodes, edges, dirty, markClean } = useFlowStore.getState();
    if (project && dirty) {
      flowsApi.save(project.id, toBackendFlow(nodes, edges)).then(markClean).catch(console.error);
    }
  }

  useUIStore.getState()._syncPhase(nextPhase);
});
