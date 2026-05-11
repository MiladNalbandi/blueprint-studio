/** Docked chat panel — forge-styled AI assistant with conversation history. */

import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useReactFlow } from '@xyflow/react';
import { useChatStore, useFlowStore, useProjectStore } from '@/stores';
import { chatApi } from '@/api/client';
import { NODE_TYPES } from '@/constants';
import { useMention } from '@/hooks/useMention';
import type { MentionableNode } from '@/hooks/useMention';
import MentionDropdown from '../function-builder/MentionDropdown';
import type { ChatMessage as ChatMessageType } from '@/types';
import { applyNodesPayload } from '@/utils/applyNodesPayload';
import { createFunctionsFromPayload } from '@/utils/createFunctionsFromPayload';
import ChatMessage from './ChatMessage';
import ChatSessionList from './ChatSessionList';

const SUGGESTIONS = [
  'Add a REST endpoint',
  'Create user CRUD flow',
  'Add validation layer',
];

export default function ChatPanel() {
  const {
    messages, isLoading, isOpen, activeSessionId,
    addMessage, setLoading, setOpen,
    loadSessions, createSession, renameSession,
  } = useChatStore();
  const nodes = useFlowStore((s) => s.nodes);
  const { project } = useProjectStore();
  const { fitView } = useReactFlow();
  const [input, setInput] = useState('');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionsLoaded = useRef(false);

  // Build mentionable node list from canvas
  const mentionableNodes: MentionableNode[] = nodes
    .filter((n) => n.data.label)
    .map((n) => ({
      id: n.id,
      label: n.data.label,
      nodeType: n.data.nodeType,
      icon: NODE_TYPES.find((t) => t.type === n.data.nodeType)?.icon ?? '?',
    }));

  const mention = useMention(mentionableNodes);

  // Load sessions when panel opens
  useEffect(() => {
    if (isOpen && project && !sessionsLoaded.current) {
      sessionsLoaded.current = true;
      loadSessions(project.id);
    }
  }, [isOpen, project, loadSessions]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setInput(text);
      mention.handleChange(text, e.target.selectionStart);
    },
    [mention],
  );

  const handleMentionSelect = useCallback(
    (node: MentionableNode) => {
      const newText = mention.handleSelect(node);
      if (newText !== null) setInput(newText);
    },
    [mention],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const ensureSession = async (): Promise<string> => {
    if (activeSessionId) return activeSessionId;
    if (!project) throw new Error('No project');
    const session = await createSession(project.id);
    return session.id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !project) return;

    // Ensure session exists BEFORE adding the user message,
    // because createSession resets messages to []
    let sessionId: string;
    try {
      sessionId = await ensureSession();
    } catch {
      return;
    }

    const referencedNodeIds = mention.resolveNodeIds(text);
    const userMsg: ChatMessageType = { role: 'user', content: text.trim(), created_at: new Date().toISOString() };
    // flushSync forces React to render the user message immediately,
    // rather than batching it with the loading state update
    flushSync(() => {
      addMessage(userMsg);
      setInput('');
    });
    setLoading(true);

    let response;
    try {
      response = await chatApi.send(project.id, text.trim(), [...messages, userMsg], referencedNodeIds, sessionId);
    } catch (err) {
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      console.error('[FlowForge AI] Chat API error:', err);
      setLoading(false);
      return;
    }

    const assistantMsg: ChatMessageType = {
      role: 'assistant',
      content: response.reply,
      created_at: new Date().toISOString(),
      nodes_created: response.nodes_created as ChatMessageType['nodes_created'],
    };
    addMessage(assistantMsg);

    // Auto-title on first message (like Claude) — update immediately for instant feedback
    if (messages.length === 0 && project && sessionId) {
      const raw = text.trim();
      const title = raw.length > 40
        ? raw.slice(0, 40).replace(/\s+\S*$/, '') + '…'
        : raw;
      renameSession(project.id, sessionId, title);
    }

    // Refresh session list to update titles/counts
    loadSessions(project.id);

    // Process AI actions using shared utility
    if (response.nodes_created) {
      try {
        const created = response.nodes_created as ChatMessageType['nodes_created'];
        if (created) {
          const idMap = applyNodesPayload(created);
          const newNodeIds = Object.values(idMap);
          // Auto-create FunctionDefinitions for service/repository nodes
          await createFunctionsFromPayload(created, idMap, project.id, text.trim());

          // Auto-zoom to newly created nodes
          if (newNodeIds.length > 0) {
            setTimeout(() => {
              fitView({
                nodes: newNodeIds.map((id) => ({ id })),
                padding: 0.3,
                maxZoom: 1.2,
                duration: 400,
              });
            }, 100);
          }
        }
      } catch (err) {
        console.error('[FlowForge AI] Failed to apply actions:', err);
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let mention hook handle navigation keys first
    if (mention.handleKeyDown(e)) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        const node = mention.filteredNodes[mention.activeIndex];
        if (node) handleMentionSelect(node);
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const activeSession = useChatStore.getState().sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      className="w-[400px] min-w-[400px] flex flex-col h-full"
      style={{
        background: 'var(--surface-1)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="relative shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Top row — new chat, title, close */}
        <div className="flex items-center px-2 py-2">
          <button
            onClick={async () => {
              if (project) {
                await createSession(project.id);
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-base text-zinc-500 hover:text-forge-400 rounded-lg hover:bg-forge-500/10 transition-colors shrink-0"
            title="New chat"
          >
            +
          </button>

          {/* Center — editable title */}
          <div className="flex-1 min-w-0 flex items-center justify-center">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={() => {
                  const trimmed = editTitle.trim();
                  if (trimmed && trimmed !== activeSession?.title && project && activeSessionId) {
                    renameSession(project.id, activeSessionId, trimmed);
                  }
                  setIsEditingTitle(false);
                }}
                className="w-full max-w-[260px] text-center text-sm font-semibold text-zinc-100 font-display tracking-wide bg-transparent outline-none px-2 py-1 rounded-lg"
                style={{ border: '1px solid rgba(249,115,22,0.3)', background: 'var(--surface-0)' }}
              />
            ) : (
              <button
                onClick={() => {
                  if (activeSession) {
                    setEditTitle(activeSession.title);
                    setIsEditingTitle(true);
                    setTimeout(() => titleInputRef.current?.select(), 0);
                  } else {
                    setShowSessionDropdown(!showSessionDropdown);
                  }
                }}
                className="group flex items-center gap-1.5 min-w-0 max-w-[280px] px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                title={activeSession ? 'Click to rename' : 'Switch conversation'}
              >
                <div className="w-2 h-2 rounded-full bg-forge-500 animate-ember-pulse shrink-0" style={{ boxShadow: '0 0 8px rgba(249,115,22,0.4)' }} />
                <span className="text-sm font-semibold text-zinc-100 font-display tracking-wide truncate">
                  {activeSession?.title || 'FlowForge AI'}
                </span>
                <svg className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L3.462 11.1a.25.25 0 0 0-.064.108l-.631 2.208 2.208-.63a.25.25 0 0 0 .108-.064l8.61-8.61a.25.25 0 0 0 0-.354l-1.086-1.086Z" />
                </svg>
              </button>
            )}
          </div>

          {/* Session list toggle + close */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className={`w-8 h-8 flex items-center justify-center text-zinc-500 rounded-lg transition-colors ${
                showSessionDropdown ? 'text-forge-400 bg-forge-500/10' : 'hover:text-zinc-300 hover:bg-white/5'
              }`}
              title="Chat history"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <line x1="2" y1="6" x2="14" y2="6" />
                <line x1="2" y1="9.5" x2="14" y2="9.5" />
              </svg>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Session dropdown */}
        {showSessionDropdown && (
          <ChatSessionList onClose={() => setShowSessionDropdown(false)} />
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-400 mb-5">Ask me to create nodes, flows, or help with your architecture</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="block w-full text-left px-3.5 py-3 text-[13px] text-zinc-400 rounded-xl transition-all hover:text-forge-400 hover:translate-x-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={msg.id || i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-2 h-2 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={mention.textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(mention.closeDropdown, 150)}
              placeholder="Ask FlowForge AI... (@ to reference nodes)"
              disabled={isLoading}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-zinc-200 outline-none font-mono placeholder:text-zinc-600 disabled:opacity-50 resize-none"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', maxHeight: '120px' }}
            />
            {mention.showDropdown && (
              <MentionDropdown
                nodes={mention.filteredNodes}
                activeIndex={mention.activeIndex}
                onSelect={handleMentionSelect}
                anchorRef={mention.textareaRef}
              />
            )}
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="btn-forge px-5 py-2.5 text-white text-sm font-display font-bold rounded-xl disabled:opacity-30 transition-opacity shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
