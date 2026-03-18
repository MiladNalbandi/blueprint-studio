/** Step 6: Configure LLM providers — forge-styled. */

import { LLM_PROVIDERS } from '@/constants';
import type { LLMWizardConfig } from '@/types';
import LLMProviderCard from '@/components/config/LLMProviderCard';

interface Props {
  configs: Record<string, LLMWizardConfig>;
  onChange: (configs: Record<string, LLMWizardConfig>) => void;
}

function defaultConfig(providerId: string): LLMWizardConfig {
  const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
  return {
    enabled: false,
    model: provider?.models[0]?.id ?? '',
    apiKey: '',
    baseUrl: provider?.defaultBaseUrl ?? '',
    temperature: 0.7,
    showKey: false,
  };
}

export default function StepLLMProvider({ configs, onChange }: Props) {
  const enabledCount = Object.values(configs).filter((c) => c.enabled).length;
  const missingKeys = Object.values(configs).filter((c) => c.enabled && !c.apiKey).length;

  const updateProvider = (id: string, data: Partial<LLMWizardConfig>) => {
    onChange({
      ...configs,
      [id]: { ...(configs[id] || defaultConfig(id)), ...data },
    });
  };

  const toggleProvider = (id: string) => {
    const current = configs[id] || defaultConfig(id);
    updateProvider(id, { enabled: !current.enabled });
  };

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <span
          className="text-[11px] font-mono px-3 py-1 rounded-full"
          style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
        >
          {enabledCount} provider{enabledCount !== 1 ? 's' : ''} configured
        </span>
        {missingKeys > 0 && (
          <span
            className="text-[11px] font-mono px-3 py-1 rounded-full"
            style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            {missingKeys} missing key{missingKeys !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Provider cards */}
      <div className="stagger-children space-y-3">
        {LLM_PROVIDERS.map((provider) => (
          <LLMProviderCard
            key={provider.id}
            provider={provider}
            config={configs[provider.id] || defaultConfig(provider.id)}
            onToggle={() => toggleProvider(provider.id)}
            onUpdate={(data) => updateProvider(provider.id, data)}
          />
        ))}
      </div>
    </div>
  );
}

export { defaultConfig };
