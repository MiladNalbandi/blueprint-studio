/** Editor for simpler node types — forge-styled. */

import type { NodeType } from '@/types';
import FunctionList from '@/components/function-builder/FunctionList';

interface Props {
  nodeType: NodeType;
  nodeId: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const MIDDLEWARE_TYPES = ['auth', 'cors', 'rate-limit', 'logging', 'cache', 'compression'];

export default function SimpleEditor({ nodeType, nodeId, config, onChange }: Props) {
  switch (nodeType) {
    case 'middleware':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Middleware Type</label>
            <div className="flex flex-wrap gap-1.5">
              {MIDDLEWARE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ ...config, type: t })}
                  className="px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all"
                  style={{
                    background: config.type === t ? 'rgba(244,114,182,0.1)' : 'transparent',
                    borderColor: config.type === t ? 'rgba(244,114,182,0.5)' : 'var(--border-subtle)',
                    color: config.type === t ? '#f472b6' : '#71717a',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'service':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Service Name</label>
            <input
              value={(config.name as string) || ''}
              onChange={(e) => onChange({ ...config, name: e.target.value })}
              placeholder="UserService"
              className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <FunctionList nodeId={nodeId} />
        </div>
      );

    case 'repository':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Entity</label>
            <input
              value={(config.entity as string) || ''}
              onChange={(e) => onChange({ ...config, entity: e.target.value })}
              placeholder="User"
              className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Methods</label>
            <div className="flex flex-wrap gap-1.5">
              {((config.methods as string[]) || []).map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 text-[10px] font-mono rounded-md"
                  style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <FunctionList nodeId={nodeId} />
        </div>
      );

    case 'event':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Event Name</label>
            <input
              value={(config.name as string) || ''}
              onChange={(e) => onChange({ ...config, name: e.target.value })}
              placeholder="UserCreated"
              className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">Async</label>
            <button
              onClick={() => onChange({ ...config, async: !config.async })}
              className="relative w-10 h-5 rounded-full transition-all duration-300"
              style={{
                background: config.async ? '#c084fc' : 'var(--surface-3)',
                boxShadow: config.async ? '0 0 10px rgba(192,132,252,0.3)' : 'none',
              }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm"
                style={{ left: config.async ? '22px' : '2px' }}
              />
            </button>
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-zinc-500">No additional configuration.</p>;
  }
}
