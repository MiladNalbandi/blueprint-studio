/** Prompt input with @-mention support and generate button. */

import { useState, useCallback } from 'react';
import { useFunctionStore } from '@/stores/useFunctionStore';
import { useProjectStore, useFlowStore } from '@/stores';
import { NODE_TYPES } from '@/constants';
import { useMention } from '@/hooks/useMention';
import type { MentionableNode } from '@/hooks/useMention';
import MentionDropdown from './MentionDropdown';

interface Props {
  functionId: string;
}

export default function PromptInput({ functionId }: Props) {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, generationError, generateCode, clearError } = useFunctionStore();
  const project = useProjectStore((s) => s.project);
  const nodes = useFlowStore((s) => s.nodes);

  // Build mentionable node list from canvas
  const mentionableNodes: MentionableNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.data.label,
    nodeType: n.data.nodeType,
    icon: NODE_TYPES.find((t) => t.type === n.data.nodeType)?.icon ?? '?',
  }));

  const mention = useMention(mentionableNodes);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setPrompt(text);
      clearError();
      mention.handleChange(text, e.target.selectionStart);
    },
    [clearError, mention],
  );

  const handleMentionSelect = useCallback(
    (node: MentionableNode) => {
      const newText = mention.handleSelect(node);
      if (newText !== null) {
        setPrompt(newText);
      }
    },
    [mention],
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || !project || isGenerating) return;
    const referencedNodeIds = mention.resolveNodeIds(prompt);
    generateCode(project.id, functionId, prompt.trim(), undefined, referencedNodeIds);
    setPrompt('');
  }, [prompt, project, isGenerating, mention, generateCode, functionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Let mention hook handle navigation keys first
      if (mention.handleKeyDown(e)) {
        // If Enter was pressed in dropdown, also insert the selected text
        if (e.key === 'Enter' || e.key === 'Tab') {
          const node = mention.filteredNodes[mention.activeIndex];
          if (node) handleMentionSelect(node);
        }
        return;
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [mention, handleMentionSelect, handleGenerate],
  );

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 block">
        Prompt
      </label>
      <div className="relative">
        <textarea
          ref={mention.textareaRef}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(mention.closeDropdown, 150)}
          placeholder="Describe what this function should do... (use @ to reference nodes)"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none resize-none"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
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
      {generationError && (
        <p className="text-[10px] text-red-400">{generationError}</p>
      )}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full py-2 rounded-lg text-xs font-bold font-display tracking-wider uppercase transition-all disabled:opacity-40"
        style={{
          background: isGenerating ? 'var(--surface-3)' : 'linear-gradient(135deg, #f97316, #ef4444)',
          color: '#fff',
          boxShadow: isGenerating ? 'none' : '0 0 20px rgba(249,115,22,0.2)',
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
      <p className="text-[9px] text-zinc-600 text-center">
        {'\u2318'}+Enter to generate
      </p>
    </div>
  );
}
