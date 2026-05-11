/** Custom hook for @-mention node references in a textarea. */

import { useState, useCallback, useRef, useMemo } from 'react';

export interface MentionableNode {
  id: string;
  label: string;
  nodeType: string;
  icon: string;
}

interface MentionState {
  showDropdown: boolean;
  query: string;
  activeIndex: number;
  filteredNodes: MentionableNode[];
  /** Character index of the `@` that triggered the dropdown */
  triggerIndex: number;
}

export function useMention(nodes: MentionableNode[]) {
  const [state, setState] = useState<MentionState>({
    showDropdown: false,
    query: '',
    activeIndex: 0,
    filteredNodes: [],
    triggerIndex: -1,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const closeDropdown = useCallback(() => {
    setState((s) => ({ ...s, showDropdown: false, query: '', activeIndex: 0, triggerIndex: -1 }));
  }, []);

  const handleChange = useCallback(
    (text: string, cursorPos: number) => {
      // Look backwards from cursor for an unfinished @mention
      const before = text.slice(0, cursorPos);
      const atIndex = before.lastIndexOf('@');

      if (atIndex === -1) {
        if (state.showDropdown) closeDropdown();
        return;
      }

      // @ must be at start or preceded by whitespace
      if (atIndex > 0 && !/\s/.test(before[atIndex - 1])) {
        if (state.showDropdown) closeDropdown();
        return;
      }

      const query = before.slice(atIndex + 1);
      // If there's a space in the query, the mention is "completed" — close
      if (query.includes(' ')) {
        if (state.showDropdown) closeDropdown();
        return;
      }

      const lowerQ = query.toLowerCase();
      const filtered = nodes.filter((n) => n.label.toLowerCase().includes(lowerQ));

      setState({
        showDropdown: filtered.length > 0,
        query,
        activeIndex: 0,
        filteredNodes: filtered,
        triggerIndex: atIndex,
      });
    },
    [nodes, state.showDropdown, closeDropdown],
  );

  const handleSelect = useCallback(
    (node: MentionableNode): string | null => {
      const ta = textareaRef.current;
      if (!ta || state.triggerIndex === -1) return null;

      const text = ta.value;
      const before = text.slice(0, state.triggerIndex);
      const after = text.slice(ta.selectionStart);
      const newText = `${before}@${node.label} ${after}`;
      closeDropdown();
      return newText;
    },
    [state.triggerIndex, closeDropdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!state.showDropdown) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setState((s) => ({
          ...s,
          activeIndex: Math.min(s.activeIndex + 1, s.filteredNodes.length - 1),
        }));
        return true;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setState((s) => ({
          ...s,
          activeIndex: Math.max(s.activeIndex - 1, 0),
        }));
        return true;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const node = state.filteredNodes[state.activeIndex];
        if (node) {
          const newText = handleSelect(node);
          return newText !== null;
        }
        return true;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return true;
      }

      return false;
    },
    [state.showDropdown, state.filteredNodes, state.activeIndex, handleSelect, closeDropdown],
  );

  /** Extract @node_label tokens from text and resolve to node IDs. */
  const resolveNodeIds = useCallback(
    (text: string): string[] => {
      const mentions = text.match(/@(\S+)/g);
      if (!mentions) return [];
      const ids: string[] = [];
      for (const m of mentions) {
        const label = m.slice(1); // remove @
        const node = nodes.find((n) => n.label.toLowerCase() === label.toLowerCase());
        if (node) ids.push(node.id);
      }
      return ids;
    },
    [nodes],
  );

  return useMemo(() => ({
    ...state,
    textareaRef,
    handleChange,
    handleSelect,
    handleKeyDown,
    closeDropdown,
    resolveNodeIds,
  }), [state, handleChange, handleSelect, handleKeyDown, closeDropdown, resolveNodeIds]);
}
