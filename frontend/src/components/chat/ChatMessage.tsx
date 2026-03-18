/** Single chat message — forge-styled, user (right) or assistant (left). */

import type { ChatMessage as ChatMessageType } from '@/types';

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
        style={isUser ? {
          background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.15))',
          border: '1px solid rgba(249,115,22,0.25)',
          color: '#fafafa',
          borderBottomRightRadius: '4px',
        } : {
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          color: '#a1a1aa',
          borderBottomLeftRadius: '4px',
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.nodes_created && message.nodes_created.nodes.length > 0 && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span className="text-[10px] font-medium text-emerald-400 font-mono">
              ✓ {message.nodes_created.nodes.length} node{message.nodes_created.nodes.length !== 1 ? 's' : ''} added
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
