/** Editor for logic block — condition + output branches, forge-styled. */

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function LogicEditor({ config, onChange }: Props) {
  const condition = (config.condition as string) || '';
  const outputs = (config.outputs as number) || 2;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Condition</label>
        <input
          value={condition}
          onChange={(e) => onChange({ ...config, condition: e.target.value })}
          placeholder="e.g. user.role === 'admin'"
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        />
      </div>
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 flex items-center justify-between">
          <span>Output Branches</span>
          <span className="text-zinc-400 font-mono normal-case">{outputs}</span>
        </label>
        <input
          type="range"
          min="2"
          max="5"
          value={outputs}
          onChange={(e) => onChange({ ...config, outputs: parseInt(e.target.value) })}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5 font-mono">
          <span>2</span>
          <span>5</span>
        </div>
      </div>
    </div>
  );
}
