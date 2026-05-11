/** Expandable unified diff viewer. */

import { useState } from 'react';
import type { FunctionRevision } from '@/types';

interface Props {
  revision: FunctionRevision | null;
}

export default function RevisionDiffView({ revision }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (!revision?.diff_from_previous) {
    return null;
  }

  const lines = revision.diff_from_previous.split('\n');

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5"
      >
        <span style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s' }}>
          ▶
        </span>
        Diff from previous
      </button>
      {expanded && (
        <div
          className="rounded-lg overflow-hidden font-mono text-[10px] leading-relaxed"
          style={{ background: '#0d1117', border: '1px solid var(--border-subtle)' }}
        >
          {lines.map((line, i) => {
            let color = '#8b949e';
            let bg = 'transparent';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              color = '#3fb950';
              bg = 'rgba(63,185,80,0.1)';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              color = '#f85149';
              bg = 'rgba(248,81,73,0.1)';
            } else if (line.startsWith('@@')) {
              color = '#79c0ff';
              bg = 'rgba(121,192,255,0.06)';
            }

            return (
              <div key={i} className="px-3 py-0.5" style={{ color, background: bg }}>
                {line || ' '}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
