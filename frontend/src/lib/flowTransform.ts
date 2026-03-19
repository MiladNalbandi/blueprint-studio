/** Convert React Flow state to the flat backend format for saving. */

import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

export function toBackendFlow(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data as FlowNodeData).nodeType,
      label: (n.data as FlowNodeData).label ?? '',
      x: n.position.x,
      y: n.position.y,
      config: (n.data as FlowNodeData).config ?? {},
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}
