/** Custom CodeMirror 6 theme matching forge aesthetic. */

import { EditorView } from '@uiw/react-codemirror';
import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';

export const forgeTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0d1117',
    color: '#e6edf3',
    fontSize: '12px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  '.cm-content': {
    caretColor: '#58a6ff',
    padding: '12px 0',
    lineHeight: '1.6',
  },
  '.cm-cursor': {
    borderLeftColor: '#58a6ff',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#0d1117',
    color: '#484f58',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '32px',
    fontSize: '11px',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    color: '#8b949e',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(56, 139, 253, 0.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(56, 139, 253, 0.2) !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(56, 139, 253, 0.2)',
    outline: '1px solid rgba(56, 139, 253, 0.4)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true });

const forgeHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff7b72' },
  { tag: tags.controlKeyword, color: '#ff7b72' },
  { tag: tags.moduleKeyword, color: '#ff7b72' },
  { tag: tags.operatorKeyword, color: '#ff7b72' },
  { tag: tags.definitionKeyword, color: '#ff7b72' },
  { tag: tags.operator, color: '#79c0ff' },
  { tag: tags.string, color: '#a5d6ff' },
  { tag: tags.regexp, color: '#a5d6ff' },
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#d2a8ff' },
  { tag: tags.function(tags.propertyName), color: '#d2a8ff' },
  { tag: tags.definition(tags.variableName), color: '#ffa657' },
  { tag: tags.definition(tags.propertyName), color: '#ffa657' },
  { tag: tags.typeName, color: '#79c0ff' },
  { tag: tags.className, color: '#79c0ff' },
  { tag: tags.number, color: '#79c0ff' },
  { tag: tags.bool, color: '#79c0ff' },
  { tag: tags.null, color: '#79c0ff' },
  { tag: tags.variableName, color: '#e6edf3' },
  { tag: tags.propertyName, color: '#79c0ff' },
  { tag: tags.self, color: '#79c0ff' },
  { tag: tags.punctuation, color: '#8b949e' },
  { tag: tags.paren, color: '#e6edf3' },
  { tag: tags.brace, color: '#e6edf3' },
  { tag: tags.bracket, color: '#e6edf3' },
  { tag: tags.meta, color: '#8b949e' },
  { tag: tags.attributeName, color: '#79c0ff' },
  { tag: tags.attributeValue, color: '#a5d6ff' },
  { tag: tags.atom, color: '#79c0ff' },
  { tag: tags.labelName, color: '#d2a8ff' },
  { tag: tags.separator, color: '#8b949e' },
  { tag: tags.escape, color: '#79c0ff' },
]);

export const forgeSyntaxHighlighting = syntaxHighlighting(forgeHighlight);

/** Map project language to CodeMirror language extension. */
export function getLanguageExtension(language: string): Extension | null {
  switch (language) {
    case 'python': return python();
    case 'typescript': return javascript({ typescript: true });
    case 'javascript': return javascript();
    case 'java': return java();
    case 'php': return php();
    case 'rust': return rust();
    case 'go': return go();
    default: return null;
  }
}
