/** Custom node component — forge-styled with ember accents. */

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { FlowNodeData, NodeType } from '@/types';

type FlowNodeType = Node<FlowNodeData>;

const NODE_STYLES: Record<NodeType, { icon: string; color: string }> = {
  endpoint:   { icon: '⚡', color: '#f97316' },
  dto:        { icon: '📦', color: '#a78bfa' },
  validator:  { icon: '✅', color: '#34d399' },
  logic:      { icon: '🧠', color: '#fbbf24' },
  entity:     { icon: '🗄️', color: '#22d3ee' },
  response:   { icon: '📤', color: '#f87171' },
  middleware:  { icon: '🔗', color: '#f472b6' },
  service:    { icon: '⚙️', color: '#fb923c' },
  repository: { icon: '📚', color: '#2dd4bf' },
  event:      { icon: '📡', color: '#c084fc' },
};

function FlowNode({ data, selected }: NodeProps<FlowNodeType>) {
  const style = NODE_STYLES[data.nodeType] || NODE_STYLES.endpoint;

  const summary = (() => {
    const cfg = data.config || {};
    switch (data.nodeType) {
      case 'endpoint': return `${cfg.method || 'GET'} ${cfg.path || '/api/'}`;
      case 'dto': return `${(cfg.fields as unknown[])?.length || 0} fields`;
      case 'validator': return `${(cfg.rules as unknown[])?.length || 0} rules → ${cfg.onFail || '422'}`;
      case 'logic': return `${cfg.outputs || 2} outputs`;
      case 'entity': {
        const parts = [cfg.tableName || 'table'];
        const colCount = (cfg.fields as unknown[])?.length || 0;
        if (colCount > 0) parts.push(`${colCount} col${colCount !== 1 ? 's' : ''}`);
        const relCount = (cfg.relations as unknown[])?.length || 0;
        if (relCount > 0) parts.push(`${relCount} rel`);
        const idxCount = (cfg.indexes as unknown[])?.length || 0;
        if (idxCount > 0) parts.push(`${idxCount} idx`);
        return parts.join(' \u00b7 ');
      }
      case 'response': return `HTTP ${cfg.status || 200}`;
      case 'middleware': return `${cfg.type || 'auth'}`;
      case 'service': return `${cfg.name || 'Service'}`;
      case 'repository': return `${(cfg.methods as unknown[])?.length || 0} methods`;
      case 'event': return `${cfg.name || 'Event'}${cfg.async ? ' ⚡' : ''}`;
      default: return '';
    }
  })();

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.color, background: 'var(--surface-0)' }}
      />
      <div
        className="min-w-[180px] rounded-xl border-[1.5px] transition-all duration-200"
        style={{
          background: selected
            ? `linear-gradient(145deg, ${style.color}08, var(--surface-1))`
            : 'var(--surface-1)',
          borderColor: selected ? `${style.color}80` : 'var(--border-subtle)',
          boxShadow: selected
            ? `0 0 30px ${style.color}20, 0 8px 24px rgba(0,0,0,0.4)`
            : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      >
        {/* Top accent line */}
        {selected && (
          <div
            className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${style.color}, transparent)`,
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: `1px solid ${style.color}20` }}>
          <span className="text-base">{style.icon}</span>
          <span className="text-sm font-semibold text-zinc-100 font-display tracking-wide">
            {data.label || data.nodeType}
          </span>
          <div
            className="ml-auto w-2 h-2 rounded-full"
            style={{ background: style.color, boxShadow: `0 0 8px ${style.color}50` }}
          />
        </div>
        {/* Body */}
        <div className="px-3.5 py-2.5 text-[11px] text-zinc-500 font-mono">
          {summary}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.color, background: style.color, boxShadow: `0 0 6px ${style.color}40` }}
      />
    </>
  );
}

export default memo(FlowNode);
