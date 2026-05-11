/** Template gallery modal — one-click flow blueprints. */

import { useState, useEffect } from 'react';
import { templatesApi } from '@/api/client';
import { applyNodesPayload } from '@/utils/applyNodesPayload';

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ICON_MAP: Record<string, string> = {
  database: '\uD83D\uDDC4\uFE0F',
  shield: '\uD83D\uDEE1\uFE0F',
  search: '\uD83D\uDD0D',
  upload: '\uD83D\uDCC1',
  event: '\uD83D\uDCE1',
  template: '\uD83D\uDCC4',
};

export default function TemplateGallery({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    templatesApi.list().then(setTemplates).finally(() => setLoading(false));
  }, []);

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      const template = await templatesApi.get(id);
      applyNodesPayload({ nodes: template.nodes, edges: template.edges });
      onClose();
    } catch (err) {
      console.error('[Templates] Failed to apply template:', err);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="text-lg font-display font-bold text-zinc-100 tracking-wide">Flow Templates</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Drop pre-built patterns onto your canvas</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/5 transition-colors"
          >
            &#x2715;
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-forge-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-12">No templates available</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApply(t.id)}
                  disabled={applying !== null}
                  className="group text-left p-4 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{ICON_MAP[t.icon] || ICON_MAP.template}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-display font-bold text-zinc-100 group-hover:text-forge-400 transition-colors">
                        {t.name}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                  {applying === t.id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-forge-400">
                      <div className="w-3 h-3 border border-forge-500 border-t-transparent rounded-full animate-spin" />
                      Applying...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
