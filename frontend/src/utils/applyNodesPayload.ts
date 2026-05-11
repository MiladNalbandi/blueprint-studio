/** Shared utility — apply a nodes_created payload (from chat AI or templates) onto the canvas. */

import type { Node, Edge } from '@xyflow/react';
import { useFlowStore } from '@/stores';
import { DEFAULT_NODE_CONFIGS } from '@/constants';
import type { FlowNodeData, NodeType } from '@/types';

/** Flow-order index for left-to-right positioning (fallback). */
const TYPE_ORDER: Record<string, number> = {
  endpoint: 0, dto: 1, validator: 2, middleware: 2,
  logic: 3, service: 4, repository: 5, entity: 6,
  response: 0, event: 4,
};

const X_GAP = 250;
const Y_GAP = 120;
const Y_OFFSET = 200;

export function computeNodePositions(
  newNodes: Array<{ type: string; tempId: string }>,
  edges: Array<{ from: string; to: string }>,
  existingNodes: Node<FlowNodeData>[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeIds = new Set(newNodes.map((n) => n.tempId));

  // Only use edges that reference nodes in this batch
  const relevantEdges = edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  // Offset below existing canvas content
  let minX = 100, maxY = 0;
  if (existingNodes.length > 0) {
    minX = Math.min(...existingNodes.map((n) => n.position.x));
    maxY = Math.max(...existingNodes.map((n) => n.position.y + 120));
  }
  const startY = existingNodes.length > 0 ? maxY + Y_OFFSET : 100;

  // If no edges, fall back to linear type-sorted layout
  if (relevantEdges.length === 0) {
    const sorted = [...newNodes].sort(
      (a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3),
    );
    sorted.forEach((n, i) => {
      positions.set(n.tempId, { x: minX + i * X_GAP, y: startY });
    });
    return positions;
  }

  // Build adjacency: parent → children
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of relevantEdges) {
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push(e.to);
    hasParent.add(e.to);
  }

  // Roots = nodes with no incoming edge
  const roots = newNodes.filter((n) => !hasParent.has(n.tempId)).map((n) => n.tempId);
  // Orphans = nodes not referenced in any edge
  const inEdge = new Set([...hasParent, ...children.keys()]);
  const orphans = newNodes.filter((n) => !inEdge.has(n.tempId)).map((n) => n.tempId);

  // DFS to assign depth and leaf slot
  const visited = new Set<string>();
  let leafSlot = 0;
  const depthMap = new Map<string, number>();
  const ySlotMap = new Map<string, number>();

  function dfs(id: string, depth: number) {
    if (visited.has(id)) return;
    visited.add(id);
    depthMap.set(id, depth);

    const kids = children.get(id);
    if (!kids || kids.length === 0) {
      // Leaf node — assign next y slot
      ySlotMap.set(id, leafSlot);
      leafSlot++;
      return;
    }

    for (const kid of kids) {
      dfs(kid, depth + 1);
    }

    // Center parent among its children's y slots
    const childSlots = kids.filter((k) => ySlotMap.has(k)).map((k) => ySlotMap.get(k)!);
    if (childSlots.length > 0) {
      ySlotMap.set(id, (Math.min(...childSlots) + Math.max(...childSlots)) / 2);
    } else {
      ySlotMap.set(id, leafSlot);
      leafSlot++;
    }
  }

  for (const root of roots) {
    dfs(root, 0);
  }
  // Handle nodes in edges but not reachable from roots (cycles)
  for (const n of newNodes) {
    if (!visited.has(n.tempId) && inEdge.has(n.tempId)) {
      dfs(n.tempId, 0);
    }
  }

  // Assign positions from tree layout
  for (const [id, depth] of depthMap) {
    const ySlot = ySlotMap.get(id) ?? 0;
    positions.set(id, { x: minX + depth * X_GAP, y: startY + ySlot * Y_GAP });
  }

  // Place orphans linearly after the tree
  orphans.forEach((id, i) => {
    positions.set(id, { x: minX + i * X_GAP, y: startY + leafSlot * Y_GAP + Y_OFFSET });
  });

  return positions;
}

export interface NodesCreatedPayload {
  nodes?: Array<{ tempId: string; type: string; label: string; config: Record<string, unknown> }>;
  edges?: Array<{ from: string; to: string }>;
  edits?: Array<{ nodeId: string; label?: string; config?: Record<string, unknown> }>;
}

/**
 * Apply a nodes_created payload to the canvas.
 * Used by both ChatPanel and TemplateGallery/OpenAPIImport.
 */
export function applyNodesPayload(payload: NodesCreatedPayload): Record<string, string> {
  const { addNodes, addEdges, updateNodeData } = useFlowStore.getState();
  const nodes = useFlowStore.getState().nodes;
  const idMap: Record<string, string> = {};

  // 1. Create new nodes
  if (Array.isArray(payload.nodes) && payload.nodes.length > 0) {
    const validCreated = payload.nodes
      .map((n) => ({ ...n, normalizedType: (n.type ?? '').toLowerCase() as NodeType }))
      .filter((n) => {
        if (!(n.normalizedType in DEFAULT_NODE_CONFIGS)) {
          console.warn(`[FlowForge] Unknown node type "${n.type}", skipping`);
          return false;
        }
        return true;
      });

    const positionMap = computeNodePositions(
      validCreated.map((n) => ({ type: n.normalizedType, tempId: n.tempId })),
      payload.edges ?? [],
      nodes,
    );

    const newNodes: Node<FlowNodeData>[] = [];
    for (let i = 0; i < validCreated.length; i++) {
      const n = validCreated[i];
      const id = `tmpl_${Date.now()}_${i}`;
      idMap[n.tempId] = id;
      const pos = positionMap.get(n.tempId) ?? { x: 250 + i * 250, y: 150 };
      // Strip `functions` from config — it's processed separately for FunctionDefinitions
      const { functions: _fns, ...restConfig } = n.config as Record<string, unknown>;
      newNodes.push({
        id,
        type: 'flowNode',
        position: pos,
        data: {
          label: n.label,
          nodeType: n.normalizedType,
          config: { ...DEFAULT_NODE_CONFIGS[n.normalizedType], ...restConfig },
        },
      });
    }
    if (newNodes.length > 0) {
      addNodes(newNodes);
    }
  }

  // 2. Create edges
  if (Array.isArray(payload.edges) && payload.edges.length > 0) {
    const existingNodeIds = new Set(
      useFlowStore.getState().nodes.map((n) => n.id),
    );
    const validEdges: Edge[] = [];

    payload.edges.forEach((e, i) => {
      const source = idMap[e.from] || e.from;
      const target = idMap[e.to] || e.to;
      if (existingNodeIds.has(source) && existingNodeIds.has(target)) {
        validEdges.push({
          id: `tmpl_edge_${Date.now()}_${i}`,
          source,
          target,
        });
      }
    });

    if (validEdges.length > 0) {
      addEdges(validEdges);
    }
  }

  // 3. Apply edits
  if (Array.isArray(payload.edits) && payload.edits.length > 0) {
    const currentNodes = useFlowStore.getState().nodes;
    for (const edit of payload.edits) {
      const exists = currentNodes.find((n) => n.id === edit.nodeId);
      if (!exists) continue;
      const data: Partial<FlowNodeData> = {};
      if (edit.label !== undefined) data.label = edit.label;
      if (edit.config) data.config = edit.config;
      updateNodeData(edit.nodeId, data);
    }
  }

  return idMap;
}
