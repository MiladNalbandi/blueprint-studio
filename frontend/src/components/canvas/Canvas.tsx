/** Main canvas — React Flow with forge-styled controls and drop zone. */

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FlowNode from './FlowNode';
import { useFlowStore, useUIStore } from '@/stores';
import { DEFAULT_NODE_CONFIGS } from '@/constants';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { FlowNodeData, NodeType } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes = { flowNode: FlowNode } as any;

let nodeIdCounter = 0;

export default function Canvas() {
  useAutoSave();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useFlowStore();
  const { selectNode, selectEdge } = useUIStore();
  const reactFlowInstance = useRef<ReactFlowInstance<Node<FlowNodeData>> | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    selectEdge(edge.id);
  }, [selectEdge]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current++;
    if (event.dataTransfer.types.includes('nodetype')) {
      setIsDraggingOver(true);
    }
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    const nodeType = event.dataTransfer.getData('nodeType') as NodeType;
    if (!nodeType || !reactFlowInstance.current) return;

    const position = reactFlowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const existingCount = nodes.filter(n => n.data.nodeType === nodeType).length;
    const label = `${nodeType}_${existingCount + 1}`;

    const newNode: Node<FlowNodeData> = {
      id: `node_${++nodeIdCounter}_${Date.now()}`,
      type: 'flowNode',
      position,
      data: {
        label,
        nodeType,
        config: { ...DEFAULT_NODE_CONFIGS[nodeType] },
      },
    };

    addNode(newNode);
    selectNode(newNode.id);
  }, [nodes, addNode, selectNode]);

  return (
    <div
      className="flex-1 h-full relative"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      {/* Drop zone overlay */}
      {isDraggingOver && (
        <div
          className="absolute inset-4 border-2 border-dashed rounded-2xl z-10 flex items-center justify-center pointer-events-none"
          style={{
            borderColor: 'rgba(249, 115, 22, 0.4)',
            background: 'rgba(249, 115, 22, 0.03)',
            boxShadow: 'inset 0 0 60px rgba(249, 115, 22, 0.05)',
          }}
        >
          <span className="text-sm text-forge-400 font-display font-semibold tracking-wide">Drop to place component</span>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={(instance: ReactFlowInstance<Node<FlowNodeData>>) => { reactFlowInstance.current = instance; }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
        deleteKeyCode={['Backspace', 'Delete']}
        style={{ background: 'var(--surface-0)' }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'rgba(249, 115, 22, 0.35)', strokeWidth: 2 },
        }}
      >
        <Controls className="!rounded-xl [&>button]:!text-zinc-400 [&>button]:!rounded-lg" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }} />
        <MiniMap
          position="top-right"
          className="!rounded-xl"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
          nodeColor={(node) => {
            const data = node.data as FlowNodeData;
            const colors: Record<string, string> = {
              endpoint: '#f97316', dto: '#a78bfa', validator: '#34d399',
              logic: '#fbbf24', entity: '#22d3ee', response: '#f87171',
              middleware: '#f472b6', service: '#fb923c', repository: '#2dd4bf', event: '#c084fc',
            };
            return colors[data?.nodeType] || '#f97316';
          }}
          maskColor="rgba(0,0,0,0.75)"
        />
        <Background variant={BackgroundVariant.Lines} gap={30} size={1} color="rgba(249, 115, 22, 0.06)" />
      </ReactFlow>
    </div>
  );
}
