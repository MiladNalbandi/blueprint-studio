/** Editor for endpoint node — HTTP method + path, forge-styled. */

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#a78bfa', DELETE: '#ef4444',
};

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function EndpointEditor({ config, onChange }: Props) {
  const method = (config.method as string) || 'GET';
  const path = (config.path as string) || '/api/';

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">HTTP Method</label>
        <div className="flex gap-1">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...config, method: m })}
              className="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all font-mono"
              style={{
                background: method === m ? `${METHOD_COLORS[m]}12` : 'transparent',
                borderColor: method === m ? `${METHOD_COLORS[m]}60` : 'var(--border-subtle)',
                color: method === m ? METHOD_COLORS[m] : '#71717a',
                boxShadow: method === m ? `0 0 8px ${METHOD_COLORS[m]}15` : 'none',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Path</label>
        <input
          value={path}
          onChange={(e) => onChange({ ...config, path: e.target.value })}
          placeholder="/api/resource"
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        />
      </div>
    </div>
  );
}
