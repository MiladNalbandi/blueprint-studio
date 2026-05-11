/** Create FunctionDefinition records from AI-generated inline function specs. */

import type { NodesCreatedPayload } from './applyNodesPayload';
import type { InlineFunctionDef } from '@/types';
import { functionsApi } from '@/api/client';
import { useFunctionStore } from '@/stores/useFunctionStore';

/**
 * After applyNodesPayload places nodes on the canvas, this function
 * iterates service/repository nodes, extracts their `functions` arrays,
 * and creates FunctionDefinition records via the API.
 */
export async function createFunctionsFromPayload(
  payload: NodesCreatedPayload,
  idMap: Record<string, string>,
  projectId: string,
  userMessage: string,
): Promise<void> {
  if (!Array.isArray(payload.nodes)) return;

  const { batchSetFunctions } = useFunctionStore.getState();

  for (const node of payload.nodes) {
    const nodeType = (node.type ?? '').toLowerCase();
    if (nodeType !== 'service' && nodeType !== 'repository') continue;

    const functions = (node.config as Record<string, unknown>).functions as InlineFunctionDef[] | undefined;
    if (!Array.isArray(functions) || functions.length === 0) continue;

    const realNodeId = idMap[node.tempId];
    if (!realNodeId) continue;

    const created = await Promise.all(
      functions.map((fn) =>
        functionsApi.create(projectId, {
          node_id: realNodeId,
          name: fn.name,
          description: fn.description || '',
          params: fn.params?.map((p) => ({ name: p.name, type: p.type, default_value: null })),
          return_type: fn.returnType || 'void',
          current_code: fn.code || '',
          current_prompt: userMessage,
          is_ai_generated: true,
        }),
      ),
    );

    batchSetFunctions(realNodeId, created);
  }
}
