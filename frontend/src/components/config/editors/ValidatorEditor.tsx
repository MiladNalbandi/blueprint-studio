/** Editor for validator node — rules list + onFail, forge-styled. */

interface Rule {
  field: string;
  rule: string;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const RULE_TYPES = ['required', 'email', 'min', 'max', 'regex', 'unique', 'exists', 'in', 'numeric', 'string'];

export default function ValidatorEditor({ config, onChange }: Props) {
  const rules = (config.rules as Rule[]) || [];
  const onFail = (config.onFail as string) || '422';

  const updateRule = (index: number, patch: Partial<Rule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange({ ...config, rules: updated });
  };

  const addRule = () => {
    onChange({ ...config, rules: [...rules, { field: '', rule: 'required' }] });
  };

  const removeRule = (index: number) => {
    onChange({ ...config, rules: rules.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Validation Rules</label>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={rule.field}
                onChange={(e) => updateRule(i, { field: e.target.value })}
                placeholder="field"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
              />
              <select
                value={rule.rule}
                onChange={(e) => updateRule(i, { rule: e.target.value })}
                className="px-2 py-1.5 rounded-lg text-xs text-zinc-200 outline-none"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
              >
                {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                onClick={() => removeRule(i)}
                className="text-zinc-600 hover:text-red-400 text-sm px-1 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addRule}
            className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-forge-400 hover:border-forge-500/40 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            + Add Rule
          </button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">On Failure</label>
        <select
          value={onFail}
          onChange={(e) => onChange({ ...config, onFail: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 outline-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        >
          <option value="400">400 Bad Request</option>
          <option value="422">422 Unprocessable Entity</option>
          <option value="403">403 Forbidden</option>
        </select>
      </div>
    </div>
  );
}
