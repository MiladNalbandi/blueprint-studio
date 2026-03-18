/** LLM Settings Modal — forge-styled overlay for editing provider configs. */

import { useState, useEffect } from 'react';
import { useLLMStore, useUIStore, useProjectStore } from '@/stores';
import { llmApi } from '@/api/client';
import { LLM_PROVIDERS } from '@/constants';
import type { LLMWizardConfig } from '@/types';
import LLMProviderCard from './LLMProviderCard';

export default function LLMSettingsModal() {
  const { showLLMSettings, setShowLLMSettings } = useUIStore();
  const { configs, setConfigs } = useLLMStore();
  const { project } = useProjectStore();
  const [localConfigs, setLocalConfigs] = useState<Record<string, LLMWizardConfig>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!showLLMSettings) return;
    const init: Record<string, LLMWizardConfig> = {};
    for (const prov of LLM_PROVIDERS) {
      const existing = configs.find((c) => c.provider === prov.id);
      init[prov.id] = {
        enabled: !!existing,
        model: existing?.model ?? prov.models[0].id,
        apiKey: '',
        baseUrl: existing?.base_url ?? prov.defaultBaseUrl,
        temperature: existing?.temperature ?? 0.7,
        showKey: false,
      };
    }
    setLocalConfigs(init);
  }, [showLLMSettings, configs]);

  if (!showLLMSettings) return null;

  const updateProvider = (id: string, data: Partial<LLMWizardConfig>) => {
    setLocalConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data },
    }));
  };

  const handleSave = async () => {
    if (!project) {
      setShowLLMSettings(false);
      return;
    }
    setIsSaving(true);
    try {
      const enabled = Object.entries(localConfigs).filter(([, cfg]) => cfg.enabled);
      const newConfigs = await Promise.all(
        enabled.map(([providerId, cfg]) =>
          llmApi.create(project.id, {
            provider: providerId,
            model: cfg.model,
            api_key: cfg.apiKey,
            base_url: cfg.baseUrl || undefined,
            temperature: cfg.temperature,
          })
        )
      );
      setConfigs(newConfigs);
    } catch (err) {
      console.error('Failed to save LLM configs:', err);
    } finally {
      setIsSaving(false);
      setShowLLMSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.65)' }}
        onClick={() => setShowLLMSettings(false)}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(249, 115, 22, 0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 font-display tracking-wide">AI Settings</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Configure LLM providers for code generation</p>
          </div>
          <button
            onClick={() => setShowLLMSettings(false)}
            className="text-zinc-500 hover:text-zinc-200 text-lg px-2 py-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Provider cards */}
        <div className="space-y-3 mb-6">
          {LLM_PROVIDERS.map((provider) => (
            <LLMProviderCard
              key={provider.id}
              provider={provider}
              config={localConfigs[provider.id] || {
                enabled: false, model: provider.models[0].id,
                apiKey: '', baseUrl: provider.defaultBaseUrl, temperature: 0.7, showKey: false,
              }}
              onToggle={() => updateProvider(provider.id, { enabled: !localConfigs[provider.id]?.enabled })}
              onUpdate={(data) => updateProvider(provider.id, data)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowLLMSettings(false)}
            className="px-4 py-2 text-sm text-zinc-400 rounded-xl transition-all hover:text-zinc-100"
            style={{ border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-forge px-6 py-2.5 text-sm font-bold text-white rounded-xl font-display disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
