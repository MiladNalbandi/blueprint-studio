/** OpenAPI import modal — upload or paste an OpenAPI spec to generate canvas nodes. */

import { useState, useRef } from 'react';
import { importApi } from '@/api/client';
import { useProjectStore } from '@/stores';
import { applyNodesPayload } from '@/utils/applyNodesPayload';

export default function OpenAPIImportModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ paths: number; schemas: number } | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { project } = useProjectStore();

  const tryPreview = (raw: string) => {
    setText(raw);
    setError('');
    setPreview(null);
    try {
      const spec = JSON.parse(raw);
      const paths = Object.keys(spec.paths || {}).length;
      const schemas = Object.keys((spec.components || {}).schemas || {}).length;
      setPreview({ paths, schemas });
    } catch {
      // Not valid JSON yet — could be partial input
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      tryPreview(content);
      setMode('paste'); // switch to paste view to show content
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!project || !text.trim()) return;
    setError('');
    setImporting(true);

    let spec: Record<string, unknown>;
    try {
      spec = JSON.parse(text);
    } catch {
      setError('Invalid JSON. Please paste a valid OpenAPI 3.x JSON spec.');
      setImporting(false);
      return;
    }

    try {
      const result = await importApi.openapi(project.id, spec);
      if (result.nodes_created) {
        applyNodesPayload(result.nodes_created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setError(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="text-lg font-display font-bold text-zinc-100 tracking-wide">Import OpenAPI</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Paste or upload an OpenAPI 3.x JSON spec</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/5 transition-colors"
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('paste')}
              className={`px-3 py-1.5 text-xs font-display font-bold rounded-lg transition-colors ${
                mode === 'paste' ? 'text-forge-400 bg-forge-500/10' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={{ border: mode === 'paste' ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--border-subtle)' }}
            >
              Paste JSON
            </button>
            <button
              onClick={() => { setMode('file'); fileRef.current?.click(); }}
              className={`px-3 py-1.5 text-xs font-display font-bold rounded-lg transition-colors ${
                mode === 'file' ? 'text-forge-400 bg-forge-500/10' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={{ border: mode === 'file' ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--border-subtle)' }}
            >
              Upload File
            </button>
            <input ref={fileRef} type="file" accept=".json,.yaml,.yml" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => tryPreview(e.target.value)}
            placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
            rows={12}
            className="w-full px-4 py-3 rounded-xl text-xs text-zinc-200 font-mono outline-none resize-none placeholder:text-zinc-600"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          />

          {/* Preview */}
          {preview && (
            <div className="flex gap-4 text-xs text-zinc-400">
              <span><span className="text-cyan-400 font-bold">{preview.paths}</span> paths</span>
              <span><span className="text-cyan-400 font-bold">{preview.schemas}</span> schemas</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-display font-bold text-zinc-400 rounded-lg hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !text.trim()}
            className="btn-forge px-5 py-2 text-white text-xs font-display font-bold rounded-xl disabled:opacity-30 transition-opacity"
          >
            {importing ? 'Importing...' : 'Import to Canvas'}
          </button>
        </div>
      </div>
    </div>
  );
}
