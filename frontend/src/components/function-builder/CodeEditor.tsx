/** Code editor component — CodeMirror 6 with syntax highlighting. */

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { forgeTheme, forgeSyntaxHighlighting, getLanguageExtension } from './editorTheme';

interface Props {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
}

export default function CodeEditor({ value, onChange, readOnly = false, language }: Props) {
  const extensions = useMemo(() => {
    const exts = [
      forgeTheme,
      forgeSyntaxHighlighting,
      bracketMatching(),
      EditorView.lineWrapping,
    ];
    if (language) {
      const lang = getLanguageExtension(language);
      if (lang) exts.push(lang);
    }
    return exts;
  }, [language]);

  return (
    <div className="relative h-full flex flex-col">
      {language && (
        <div
          className="flex items-center px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider"
          style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {language}
        </div>
      )}
      <div className="flex-1 overflow-auto" style={{ background: '#0d1117' }}>
        <CodeMirror
          value={value}
          onChange={readOnly ? undefined : onChange}
          readOnly={readOnly}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            bracketMatching: false, // we add our own
            foldGutter: false,
            autocompletion: false,
            searchKeymap: true,
            indentOnInput: true,
          }}
          theme="none"
          placeholder={readOnly ? '' : '// Function body will appear here after generation...'}
        />
      </div>
    </div>
  );
}
