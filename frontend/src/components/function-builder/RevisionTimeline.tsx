/** Vertical timeline of function revisions. Click to preview, then activate. */

import type { FunctionRevision } from '@/types';

interface Props {
  revisions: FunctionRevision[];
  onRestore: (revisionId: string) => void;
  onSelect: (revision: FunctionRevision) => void;
  selectedId?: string | null;
}

export default function RevisionTimeline({ revisions, onRestore, onSelect, selectedId }: Props) {
  if (revisions.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[10px] text-zinc-600">No revisions yet</p>
        <p className="text-[9px] text-zinc-700 mt-1">Generate code to create the first revision</p>
      </div>
    );
  }

  const latestId = revisions[revisions.length - 1]?.id;

  return (
    <div className="space-y-0">
      <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-2 block">
        Revisions
      </label>
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ background: 'var(--border-subtle)' }}
        />

        {[...revisions].reverse().map((rev) => {
          const isSelected = selectedId === rev.id;
          const isLatest = rev.id === latestId;
          const isRestore = rev.provider === 'restore';
          const time = new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={rev.id}
              onClick={() => onSelect(rev)}
              className="relative pl-6 py-2 cursor-pointer group"
            >
              {/* Dot */}
              <div
                className="absolute left-[3px] top-3 w-[9px] h-[9px] rounded-full border-2 transition-all"
                style={{
                  borderColor: isSelected ? '#f97316' : isLatest ? '#22d3ee' : isRestore ? '#a78bfa' : '#3b82f6',
                  background: isSelected ? '#f97316' : isLatest ? '#22d3ee' : 'var(--surface-1)',
                  boxShadow: isSelected ? '0 0 8px rgba(249,115,22,0.4)' : isLatest ? '0 0 8px rgba(34,211,238,0.3)' : 'none',
                }}
              />

              {/* Content */}
              <div
                className="rounded-lg px-2.5 py-1.5 transition-all"
                style={{
                  background: isSelected ? 'rgba(249,115,22,0.08)' : 'transparent',
                  border: isSelected ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-300">
                    #{rev.revision_number}
                  </span>
                  <div className="flex items-center gap-2">
                    {isLatest && (
                      <span className="text-[9px] font-display font-bold uppercase tracking-wider text-cyan-400">
                        current
                      </span>
                    )}
                    {isSelected && !isLatest && (
                      <span className="text-[9px] font-display font-bold uppercase tracking-wider text-orange-400">
                        previewing
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600 font-mono">{time}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">
                  {rev.prompt}
                </p>
                {rev.provider && rev.provider !== 'restore' && (
                  <span className="text-[9px] text-zinc-600 font-mono">{rev.provider}/{rev.model}</span>
                )}
                {isRestore && (
                  <span className="text-[9px] text-purple-400 font-mono">restored</span>
                )}
                {isSelected && !isLatest && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestore(rev.id); }}
                    className="mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-display font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                      boxShadow: '0 0 8px rgba(249,115,22,0.2)',
                    }}
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
