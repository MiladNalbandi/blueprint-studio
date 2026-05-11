/** Auto-save hook: persists flow state to backend when dirty (debounced). */

import { useEffect, useRef } from 'react';
import { useFlowStore, useProjectStore } from '@/stores';
import { flowsApi } from '@/api/client';
import { toBackendFlow } from '@/lib/flowTransform';

const DEBOUNCE_MS = 1_000;

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = useFlowStore.subscribe((state, prevState) => {
      // Only save when the store is explicitly marked dirty by user actions
      if (!state.dirty) return;
      // Skip if nodes & edges reference didn't actually change
      if (state.nodes === prevState.nodes && state.edges === prevState.edges) return;

      const projectId = useProjectStore.getState().project?.id;
      if (!projectId) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const { nodes, edges, dirty, markClean } = useFlowStore.getState();
        if (!dirty) return;
        try {
          await flowsApi.save(projectId, toBackendFlow(nodes, edges));
          markClean();
        } catch (err) {
          console.error('[AutoSave] Failed to save flow:', err);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, []);
}
