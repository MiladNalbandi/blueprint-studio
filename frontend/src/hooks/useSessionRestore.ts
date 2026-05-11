/** Restore project session on page reload — reads project ID from URL and loads all data. */

import { useEffect, useRef } from 'react';
import { projectsApi, flowsApi, llmApi } from '@/api/client';
import {
  useProjectStore,
  useFlowStore,
  useLLMStore,
  useChatStore,
  useUIStore,
} from '@/stores';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

export function useSessionRestore() {
  const didRestore = useRef(false);
  const { phase, pendingProjectId } = useUIStore();
  const { project, setProject } = useProjectStore();

  useEffect(() => {
    // Only restore once, only on canvas phase, only if no project is loaded
    if (didRestore.current || phase !== 'canvas' || project || !pendingProjectId) return;
    didRestore.current = true;

    const restore = async () => {
      try {
        const loadedProject = await projectsApi.get(pendingProjectId);
        setProject(loadedProject);

        // Load flow
        const flowData = await flowsApi.get(loadedProject.id);
        if (flowData) {
          const rfNodes: Node<FlowNodeData>[] = (flowData.nodes ?? []).map(
            (n: { id: string; type: string; label: string; x: number; y: number; config: Record<string, unknown> }) => ({
              id: n.id,
              type: 'flowNode',
              position: { x: n.x, y: n.y },
              data: {
                label: n.label,
                nodeType: n.type,
                config: n.config ?? {},
              },
            })
          );
          const rfEdges: Edge[] = (flowData.edges ?? []).map(
            (e: { id: string; source: string; target: string }) => ({
              id: e.id,
              source: e.source,
              target: e.target,
            })
          );
          useFlowStore.getState().setNodes(rfNodes);
          useFlowStore.getState().setEdges(rfEdges);
        }

        // Load LLM configs
        const configs = await llmApi.list(loadedProject.id);
        useLLMStore.getState().setConfigs(configs);

        useChatStore.getState().clear();
      } catch (err) {
        console.error('[SessionRestore] Failed to restore project:', err);
        // Redirect to dashboard on failure
        useUIStore.getState().setPhase('dashboard');
      }
    };

    restore();
  }, [phase, pendingProjectId, project, setProject]);
}
