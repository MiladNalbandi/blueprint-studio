/** Editor for DTO node — dynamic fields list, forge-styled. */

interface Field {
  name: string;
  type: string;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const FIELD_TYPES = ['string', 'int', 'float', 'boolean', 'date', 'array', 'object'];

export default function DTOEditor({ config, onChange }: Props) {
  const fields = (config.fields as Field[]) || [];

  const updateField = (index: number, patch: Partial<Field>) => {
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
    <div className="space-y-2">
      <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1 block">Fields</label>
      {fields.map((field, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={field.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
            placeholder="field name"
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          />
          <select
            value={field.type}
            onChange={(e) => updateField(i, { type: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-xs text-zinc-200 outline-none"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          >
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => removeField(i)}
            className="text-zinc-600 hover:text-red-400 text-sm px-1 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addField}
        className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-forge-400 hover:border-forge-500/40 transition-colors"
        style={{ borderColor: 'var(--border)' }}
      >
        + Add Field
      </button>
    </div>
  );
}
