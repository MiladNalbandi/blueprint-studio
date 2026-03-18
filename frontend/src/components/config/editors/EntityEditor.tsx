/** Editor for entity node — table name + columns, forge-styled. */

interface Column {
  name: string;
  type: string;
  primary?: boolean;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const COLUMN_TYPES = ['integer', 'bigint', 'string', 'text', 'boolean', 'float', 'decimal', 'date', 'datetime', 'json', 'uuid'];

export default function EntityEditor({ config, onChange }: Props) {
  const tableName = (config.tableName as string) || '';
  const fields = (config.fields as Column[]) || [];

  const updateField = (index: number, patch: Partial<Column>) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange({ ...config, fields: updated });
  };

  const addField = () => {
    onChange({ ...config, fields: [...fields, { name: '', type: 'string' }] });
  };

  const removeField = (index: number) => {
    onChange({ ...config, fields: fields.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Table Name</label>
        <input
          value={tableName}
          onChange={(e) => onChange({ ...config, tableName: e.target.value })}
          placeholder="users"
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        />
      </div>
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Columns</label>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={field.name}
                onChange={(e) => updateField(i, { name: e.target.value })}
                placeholder="column"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
              />
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value })}
                className="px-2 py-1.5 rounded-lg text-xs text-zinc-200 outline-none"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
              >
                {COLUMN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {field.primary ? (
                <span className="text-[9px] text-forge-400 font-bold font-mono" style={{ textShadow: '0 0 8px rgba(249,115,22,0.3)' }}>PK</span>
              ) : (
                <button
                  onClick={() => removeField(i)}
                  className="text-zinc-600 hover:text-red-400 text-sm px-1 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addField}
            className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-forge-400 hover:border-forge-500/40 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            + Add Column
          </button>
        </div>
      </div>
    </div>
  );
}
