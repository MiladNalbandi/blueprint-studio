/** Floating chat panel — forge-styled AI assistant. */

import { useState, useRef, useEffect } from 'react';
import { useChatStore, useFlowStore, useProjectStore } from '@/stores';
import { chatApi } from '@/api/client';
import { DEFAULT_NODE_CONFIGS } from '@/constants';
import type { FlowNodeData, NodeType, ChatMessage as ChatMessageType } from '@/types';
import type { Node, Edge } from '@xyflow/react';
import ChatMessage from './ChatMessage';

const SUGGESTIONS = [
  'Add a REST endpoint',
  'Create user CRUD flow',
  'Add validation layer',
];

export default function ChatPanel() {
  const { messages, isLoading, isOpen, addMessage, setLoading, setOpen } = useChatStore();
  const { addNodes, addEdges } = useFlowStore();
  const { project } = useProjectStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !project) return;

    const userMsg: ChatMessageType = { role: 'user', content: text.trim() };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.send(project.id, text.trim(), [...messages, userMsg]);

      const assistantMsg: ChatMessageType = {
        role: 'assistant',
        content: response.reply,
        nodes_created: response.nodes_created as ChatMessageType['nodes_created'],
      };
      addMessage(assistantMsg);

      if (response.nodes_created) {
        const created = response.nodes_created as ChatMessageType['nodes_created'];
        if (created && created.nodes.length > 0) {
          const idMap: Record<string, string> = {};
          const newNodes: Node<FlowNodeData>[] = created.nodes.map((n, i) => {
            const id = `chat_${Date.now()}_${i}`;
            idMap[n.tempId] = id;
            return {
              id,
              type: 'flowNode',
              position: { x: 250 + i * 250, y: 150 + (i % 2) * 100 },
              data: {
                label: n.label,
                nodeType: n.type,
                config: { ...DEFAULT_NODE_CONFIGS[n.type as NodeType], ...n.config },
              },
            };
          });
          addNodes(newNodes);

          if (created.edges.length > 0) {
            const newEdges: Edge[] = created.edges.map((e, i) => ({
              id: `chat_edge_${Date.now()}_${i}`,
              source: idMap[e.from] || e.from,
              target: idMap[e.to] || e.to,
            }));
            addEdges(newEdges);
          }
        }
      }
    } catch (err) {
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 w-[400px] h-[600px] rounded-2xl flex flex-col overflow-hidden z-40"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 40px rgba(249, 115, 22, 0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-forge-500 animate-ember-pulse" style={{ boxShadow: '0 0 8px rgba(249,115,22,0.4)' }} />
          <span className="text-sm font-bold text-zinc-100 font-display tracking-wide">FlowForge AI</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-zinc-500 hover:text-zinc-200 text-sm px-1.5 py-0.5 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-xs mb-5">Ask me to create nodes, flows, or help with your architecture</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="block w-full text-left px-3.5 py-2.5 text-xs text-zinc-400 rounded-xl transition-all hover:text-forge-400 hover:translate-x-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-forge-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask FlowForge AI..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-xl text-xs text-zinc-200 outline-none font-mono placeholder:text-zinc-600 disabled:opacity-50"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="btn-forge px-4 py-2 text-white text-xs font-display font-bold rounded-xl disabled:opacity-30 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
