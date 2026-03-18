/** Shared LLM provider card — forge-styled, used by wizard & settings modal. */

import type { LLMProviderDef } from '@/constants';
import type { LLMWizardConfig } from '@/types';

interface Props {
  provider: LLMProviderDef;
  config: LLMWizardConfig;
  onToggle: () => void;
  onUpdate: (data: Partial<LLMWizardConfig>) => void;
}

export default function LLMProviderCard({ provider, config, onToggle, onUpdate }: Props) {
  return (
    <div
      className="rounded-2xl transition-all duration-300 overflow-hidden"
      style={{
        border: `1.5px solid ${config.enabled ? `${provider.color}40` : 'var(--border-subtle)'}`,
        background: config.enabled
          ? `linear-gradient(145deg, ${provider.color}06, var(--surface-1))`
          : 'var(--surface-1)',
        boxShadow: config.enabled
          ? `0 0 24px ${provider.color}10, inset 0 1px 0 rgba(255,255,255,0.02)`
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Header with toggle */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="text-xl">{provider.icon}</span>
        <span className="text-sm font-bold text-zinc-100 font-display tracking-wide flex-1">{provider.name}</span>
        <button
          onClick={onToggle}
          className="relative w-10 h-5 rounded-full transition-all duration-300"
          style={{
            background: config.enabled ? provider.color : 'var(--surface-3)',
            boxShadow: config.enabled ? `0 0 10px ${provider.color}40` : 'none',
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm"
            style={{ left: config.enabled ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Expanded config */}
      {config.enabled && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Model selection */}
          <div className="pt-3">
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Model</label>
            <div className="space-y-1">
              {provider.models.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  style={{ background: config.model === m.id ? `${provider.color}10` : 'transparent' }}
                >
                  <input
                    type="radio"
                    name={`model-${provider.id}`}
                    checked={config.model === m.id}
                    onChange={() => onUpdate({ model: m.id })}
                    className="accent-orange-500"
                  />
                  <span className="text-xs text-zinc-300">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">API Key</label>
            <div className="relative">
              <input
                type={config.showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                placeholder={`${provider.name} API key...`}
                className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none pr-16"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
              />
              <button
                onClick={() => onUpdate({ showKey: !config.showKey })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded font-mono"
                style={{ background: 'var(--surface-3)' }}
              >
                {config.showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Base URL</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => onUpdate({ baseUrl: e.target.value })}
              placeholder={provider.defaultBaseUrl}
              className="w-full px-3 py-2 rounded-lg text-xs text-zinc-200 font-mono outline-none"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
            />
          </div>

          {/* Temperature */}
          <div>
            <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 flex items-center justify-between">
              <span>Temperature</span>
              <span className="text-zinc-400 font-mono normal-case">{config.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 pt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: config.apiKey ? '#22c55e' : '#f59e0b',
                boxShadow: config.apiKey ? '0 0 6px #22c55e40' : '0 0 6px #f59e0b40',
              }}
            />
            <span className="text-[10px] text-zinc-500 font-mono">
              {config.apiKey ? 'API key configured' : 'Missing API key'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
