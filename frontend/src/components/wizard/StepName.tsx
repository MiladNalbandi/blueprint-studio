/** Step 0: Name your project. */

interface Props {
  value: string;
  onChange: (name: string) => void;
}

export default function StepName({ value, onChange }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="my-awesome-project"
        autoFocus
        className="w-full max-w-md px-5 py-3.5 rounded-xl text-zinc-100 text-lg font-mono placeholder:text-zinc-600 outline-none transition-all focus:ring-2 focus:ring-forge-500/40"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
      />
      <p className="text-xs text-zinc-600 font-mono">
        You can always rename it later
      </p>
    </div>
  );
}
