/** Floating dropdown for @-mentioning canvas nodes in the prompt. */

import { useEffect, useRef } from 'react';
import type { MentionableNode } from '@/hooks/useMention';
import { NODE_TYPES } from '@/constants';

interface Props {
  nodes: MentionableNode[];
  activeIndex: number;
  onSelect: (node: MentionableNode) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
}

function getNodeIcon(nodeType: string): string {
  return NODE_TYPES.find((n) => n.type === nodeType)?.icon ?? '?';
}

function getNodeColor(nodeType: string): string {
  return NODE_TYPES.find((n) => n.type === nodeType)?.color ?? '#71717a';
}

export default function MentionDropdown({ nodes, activeIndex, onSelect, anchorRef }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Position relative to textarea
  const anchor = anchorRef.current;
  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();

  return (
    <div
      ref={listRef}
      className="fixed z-50 max-h-[210px] w-64 overflow-y-auto rounded-lg py-1 shadow-xl"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
        left: rect.left,
        bottom: window.innerHeight - rect.top + 4,
      }}
    >
      {nodes.slice(0, 20).map((node, i) => (
        <button
          key={node.id}
          onMouseDown={(e) => {
            e.preventDefault(); // keep textarea focus
            onSelect(node);
          }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors"
          style={{
            background: i === activeIndex ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
          }}
        >
          <span className="text-sm shrink-0">{getNodeIcon(node.nodeType)}</span>
          <span className="text-xs font-mono text-zinc-200 truncate flex-1">{node.label}</span>
          <span
            className="text-[9px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: getNodeColor(node.nodeType),
              background: `${getNodeColor(node.nodeType)}18`,
            }}
          >
            {node.nodeType}
          </span>
        </button>
      ))}
    </div>
  );
}
