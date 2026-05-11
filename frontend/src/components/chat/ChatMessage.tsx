/** Single chat message — forge-styled, user (right) or assistant (left). */

import { useState, useCallback } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types';

interface Props {
  message: ChatMessageType;
}

function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
      style={{ color: copied ? '#22c55e' : '#71717a', background: 'var(--surface-1)' }}
      title="Copy code"
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

/** Render simple markdown: code blocks and inline code. */
function renderContent(text: string) {
  const parts: Array<{ type: 'text' | 'code-block' | 'inline'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code-block', content: match[2], lang: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.map((part, i) => {
    if (part.type === 'code-block') {
      return (
        <pre
          key={i}
          className="my-1.5 rounded-lg text-xs font-mono overflow-x-auto"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between px-3.5 py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-[10px] font-display font-semibold text-zinc-500 uppercase tracking-wider">
              {part.lang || 'code'}
            </span>
            <CodeBlockCopyButton code={part.content} />
          </div>
          <code className="block px-3.5 py-2.5">{part.content}</code>
        </pre>
      );
    }
    // Handle inline code within text parts
    const inlineParts = part.content.split(/(`[^`]+`)/g);
    return (
      <span key={i}>
        {inlineParts.map((seg, j) => {
          if (seg.startsWith('`') && seg.endsWith('`')) {
            return (
              <code
                key={j}
                className="px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300"
                style={{ background: 'rgba(34,211,238,0.12)' }}
              >
                {seg.slice(1, -1)}
              </code>
            );
          }
          return seg;
        })}
      </span>
    );
  });
}

function formatTime(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const time = formatTime(message.created_at);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content]);

  return (
    <div className={`group/msg flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[85%]">
        <div
          className="px-4 py-3 rounded-xl text-[13px] leading-relaxed"
          style={isUser ? {
            background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.15))',
            border: '1px solid rgba(249,115,22,0.25)',
            color: '#fafafa',
            borderBottomRightRadius: '4px',
          } : {
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            color: '#d4d4d8',
            borderBottomLeftRadius: '4px',
          }}
        >
          <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>

          {message.nodes_created && (message.nodes_created.nodes?.length || message.nodes_created.edits?.length) && (
            <div className="mt-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderLeft: '2px solid rgba(34,197,94,0.5)' }}>
              <span className="text-xs font-medium text-emerald-400 font-mono">
                {message.nodes_created.nodes?.length ? `✓ ${message.nodes_created.nodes.length} node${message.nodes_created.nodes.length !== 1 ? 's' : ''} added` : ''}
                {message.nodes_created.nodes?.length && message.nodes_created.edits?.length ? ' · ' : ''}
                {message.nodes_created.edits?.length ? `✎ ${message.nodes_created.edits.length} node${message.nodes_created.edits.length !== 1 ? 's' : ''} edited` : ''}
              </span>
            </div>
          )}

          {time && (
            <div className={`mt-1 text-[10px] ${isUser ? 'text-orange-400/50' : 'text-zinc-500'}`}>
              {time}
            </div>
          )}
        </div>

        {/* Copy button — appears on hover */}
        <button
          onClick={handleCopy}
          className={`absolute -bottom-1 ${isUser ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} opacity-0 group-hover/msg:opacity-100 transition-opacity text-[10px] font-mono px-2 py-0.5 rounded-md`}
          style={{
            color: copied ? '#22c55e' : '#71717a',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Copy message"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  );
}
