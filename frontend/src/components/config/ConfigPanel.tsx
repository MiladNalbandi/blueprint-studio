/** Right sidebar — forge-styled node config panel. */

import { useFlowStore, useUIStore } from '@/stores';
import { NODE_TYPES } from '@/constants';
import type { FlowNodeData } from '@/types';
import EndpointEditor from './editors/EndpointEditor';
import DTOEditor from './editors/DTOEditor';
import ValidatorEditor from './editors/ValidatorEditor';
import LogicEditor from './editors/LogicEditor';
import ResponseEditor from './editors/ResponseEditor';
import EntityEditor from './editors/EntityEditor';
import SimpleEditor from './editors/SimpleEditor';

export default function ConfigPanel() {
  const { selectedNodeId, showConfigPanel, selectNode } = useUIStore();
  const { nodes, updateNodeData } = useFlowStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!showConfigPanel || !node) return null;

  const data = node.data as FlowNodeData;
  const typeDef = NODE_TYPES.find((t) => t.type === data.nodeType);

  const handleConfigChange = (config: Record<string, unknown>) => {
    updateNodeData(node.id, { config });
  };

  const renderEditor = () => {
    switch (data.nodeType) {
      case 'endpoint':
        return <EndpointEditor config={data.config} onChange={handleConfigChange} />;
      case 'dto':
        return <DTOEditor config={data.config} onChange={handleConfigChange} />;
      case 'validator':
        return <ValidatorEditor config={data.config} onChange={handleConfigChange} />;
      case 'logic':
        return <LogicEditor config={data.config} onChange={handleConfigChange} />;
      case 'response':
        return <ResponseEditor config={data.config} onChange={handleConfigChange} />;
      case 'entity':
        return <EntityEditor config={data.config} onChange={handleConfigChange} />;
      default:
        return <SimpleEditor nodeType={data.nodeType} config={data.config} onChange={handleConfigChange} />;
    }
  };

  return (
    <div
      className="w-[280px] shrink-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{
            background: typeDef ? `${typeDef.color}10` : 'var(--surface-3)',
            border: `1px solid ${typeDef?.color ?? 'var(--border)'}25`,
          }}
        >
          {typeDef?.icon ?? '?'}
        </div>
        <span className="text-xs font-bold text-zinc-100 font-display tracking-wide flex-1">{typeDef?.name ?? data.nodeType}</span>
        <button
          onClick={() => selectNode(null)}
          className="text-zinc-500 hover:text-zinc-200 text-sm px-1 py-0.5 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Label input */}
        <div>
          <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Label</label>
          <input
            value={data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            placeholder={typeDef?.name ?? data.nodeType}
            className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          />
        </div>

        {renderEditor()}
      </div>
    </div>
  );
}
