/** Delete button — forge-styled, shown when a node or edge is selected. */

import { useFlowStore, useUIStore } from '@/stores';

export default function DeleteButton() {
  const { selectedNodeId, selectedEdgeId, selectNode, selectEdge } = useUIStore();
  const { deleteNode, deleteEdge } = useFlowStore();

  if (!selectedNodeId && !selectedEdgeId) return null;

  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      selectNode(null);
    } else if (selectedEdgeId) {
      deleteEdge(selectedEdgeId);
      selectEdge(null);
    }
  };

  const label = selectedNodeId ? 'Delete Node' : 'Delete Connection';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
      <button
        onClick={handleDelete}
        className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-display font-bold tracking-wide rounded-xl transition-all hover:translate-y-[-1px]"
        style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        🗑️ {label}
      </button>
    </div>
  );
}
