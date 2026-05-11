/** Terminal-like log viewer for runner output. */

import { useEffect, useRef } from 'react';

interface Props {
  logs: string[];
  running: boolean;
  onClear: () => void;
}

export default function LogTerminal({ logs, running, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Terminal header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: running ? '#22c55e' : '#71717a',
              boxShadow: running ? '0 0 6px #22c55e50' : 'none',
            }}
          />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {running ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={onClear}
          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Log output */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-5"
        style={{ background: '#0a0e14' }}
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600">
            <p>Ready to run. Click <span className="text-orange-400/60">Run</span> to start the server.</p>
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="text-zinc-600 select-none mr-3">{String(i + 1).padStart(3)}</span>
              <span className={
                line.startsWith('[ERROR') || line.toLowerCase().includes('error')
                  ? 'text-red-400'
                  : line.startsWith('[WARN') || line.toLowerCase().includes('warning')
                  ? 'text-yellow-400'
                  : line.startsWith('>')
                  ? 'text-cyan-400'
                  : 'text-zinc-300'
              }>
                {line}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
