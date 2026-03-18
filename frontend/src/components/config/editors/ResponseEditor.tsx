/** Editor for response node — status code + response type, forge-styled. */

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const STATUS_CODES = [
  { value: 200, label: '200 OK' },
  { value: 201, label: '201 Created' },
  { value: 204, label: '204 No Content' },
  { value: 301, label: '301 Redirect' },
  { value: 400, label: '400 Bad Request' },
  { value: 401, label: '401 Unauthorized' },
  { value: 403, label: '403 Forbidden' },
  { value: 404, label: '404 Not Found' },
  { value: 500, label: '500 Server Error' },
];

const RESPONSE_TYPES = ['json', 'xml', 'text', 'empty'] as const;

export default function ResponseEditor({ config, onChange }: Props) {
  const status = (config.status as number) || 200;
  const type = (config.type as string) || 'json';

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Status Code</label>
        <select
          value={status}
          onChange={(e) => onChange({ ...config, status: parseInt(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 outline-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        >
          {STATUS_CODES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Response Type</label>
        <div className="flex gap-1">
          {RESPONSE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...config, type: t })}
              className="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase font-mono"
              style={{
                background: type === t ? 'rgba(249,115,22,0.1)' : 'transparent',
                borderColor: type === t ? 'rgba(249,115,22,0.5)' : 'var(--border-subtle)',
                color: type === t ? '#f97316' : '#71717a',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
