/** Chat session dropdown — appears below the header when toggled. */

import { useState, useRef, useEffect } from 'react';
import { useChatStore, useProjectStore } from '@/stores';
import type { ChatSession } from '@/types';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

interface Props {
  onClose: () => void;
}

export default function ChatSessionList({ onClose }: Props) {
  const { project } = useProjectStore();
  const { sessions, activeSessionId, createSession, selectSession, deleteSession } = useChatStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!project) return null;

  const handleNewChat = async () => {
    await createSession(project.id);
    onClose();
  };

  const handleSelect = (session: ChatSession) => {
    if (session.id !== activeSessionId) {
      selectSession(project.id, session.id);
    }
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(project.id, sessionId);
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-50 mt-0.5 max-h-[360px] flex flex-col overflow-hidden rounded-b-xl animate-fade-up"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* New Chat */}
      <button
        onClick={handleNewChat}
        className="flex items-center gap-2 px-4 py-3 text-xs font-display font-semibold text-forge-400 transition-all hover:bg-forge-500/10 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-base font-bold">+</span> New Chat
      </button>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No conversations yet</p>
        )}
        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          const isHovered = hoveredId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full text-left px-4 py-3 transition-all text-xs relative flex items-center gap-3 ${
                isActive
                  ? 'text-zinc-100 bg-forge-500/8'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
              style={{
                borderLeft: isActive ? '2px solid #f97316' : '2px solid transparent',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold">{s.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-zinc-600">{formatRelativeTime(s.updated_at)}</span>
                  {s.message_count > 0 && (
                    <span className="text-[10px] text-zinc-600">{s.message_count} msg{s.message_count !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              {isHovered && (
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-red-400 text-xs rounded-md transition-colors shrink-0"
                  title="Delete conversation"
                >
                  ✕
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
