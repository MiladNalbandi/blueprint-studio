/** Top bar — forge-styled logo, config badges, LLM indicators, AI Settings. */

import { useProjectStore, useLLMStore, useFlowStore, useUIStore } from '@/stores';
import { LANGUAGES, ARCHITECTURES, LLM_PROVIDERS } from '@/constants';
import { getTechIcon } from '@/lib/techIcons';

export default function TopBar() {
  const { project } = useProjectStore();
  const { configs } = useLLMStore();
  const { nodes, edges } = useFlowStore();
  const { setShowLLMSettings } = useUIStore();

  const config = project?.config;
  const langDef = config ? LANGUAGES.find((l) => l.id === config.language) : null;
  const archDef = config ? ARCHITECTURES.find((a) => a.id === config.architecture) : null;

  return (
    <div
      className="h-12 min-h-[48px] shrink-0 flex items-center px-4 gap-3"
      style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'var(--forge-glow)', border: '1px solid rgba(249,115,22,0.25)' }}>
        ⚒️
      </div>
      <span className="text-zinc-100 font-bold text-sm font-display tracking-wide">FlowForge</span>
      <div className="w-px h-5" style={{ background: 'var(--border)' }} />

      {/* Config badges */}
      {config && (
        <div className="flex items-center gap-1.5">
          {langDef && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium inline-flex items-center gap-1"
              style={{ color: langDef.color, borderColor: `${langDef.color}30`, background: `${langDef.color}08` }}
            >
              {getTechIcon(langDef.id) ?? langDef.icon} {langDef.name}{config.framework ? ` · ${config.framework}` : ''}
            </span>
          )}
          {config.database && config.database !== 'none' && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium text-cyan-400 border-cyan-500/20 bg-cyan-500/5">
              🗄️ {config.database}{config.orm ? ` · ${config.orm}` : ''}
            </span>
          )}
          {archDef && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium"
              style={{ color: archDef.color, borderColor: `${archDef.color}30`, background: `${archDef.color}08` }}
            >
              {archDef.icon} {archDef.name}
            </span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* LLM provider badges */}
      <div className="flex items-center gap-1.5">
        {configs.map((cfg) => {
          const provDef = LLM_PROVIDERS.find((p) => p.id === cfg.provider);
          if (!provDef) return null;
          return (
            <span
              key={cfg.id}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1.5 font-medium"
              style={{ color: provDef.color, borderColor: `${provDef.color}30`, background: `${provDef.color}08` }}
            >
              {provDef.icon} {cfg.model.split('/').pop()?.split('-').slice(0, 2).join('-') || cfg.model}
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: cfg.has_api_key ? '#22c55e' : '#f59e0b', boxShadow: cfg.has_api_key ? '0 0 6px #22c55e40' : '0 0 6px #f59e0b40' }}
              />
            </span>
          );
        })}
      </div>

      {/* AI Settings button */}
      <button
        onClick={() => setShowLLMSettings(true)}
        className="text-[11px] font-display font-semibold text-zinc-400 px-3 py-1.5 rounded-lg transition-all hover:text-forge-400 hover:bg-forge-500/5"
        style={{ border: '1px solid var(--border)' }}
      >
        AI Settings
      </button>

      <div className="w-px h-5" style={{ background: 'var(--border)' }} />

      {/* Node/edge count */}
      <span className="text-[10px] font-mono text-zinc-600">
        {nodes.length}n · {edges.length}e
      </span>
    </div>
  );
}
