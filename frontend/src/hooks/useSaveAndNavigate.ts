/** Save the current flow state (if dirty) and navigate to a different phase. */

import { useCallback } from 'react';
import { useFlowStore, useProjectStore, useUIStore } from '@/stores';
import { flowsApi } from '@/api/client';
import { toBackendFlow } from '@/lib/flowTransform';

export function useSaveAndNavigate() {
  const setPhase = useUIStore((s) => s.setPhase);

  return useCallback(
    async (target: 'dashboard' | 'wizard' | 'canvas') => {
      const project = useProjectStore.getState().project;
      const { nodes, edges, dirty, markClean } = useFlowStore.getState();

      if (project && dirty) {
        try {
          await flowsApi.save(project.id, toBackendFlow(nodes, edges));
          markClean();
        } catch (err) {
          console.error('[SaveAndNavigate] Failed to save flow:', err);
        }
      }

      setPhase(target);
    },
    [setPhase],
  );
}
