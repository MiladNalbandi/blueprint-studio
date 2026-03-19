/** Wizard orchestrator — manages 6-step project setup flow with forge aesthetic. */

import { useState } from 'react';
import { projectsApi, llmApi } from '@/api/client';
import { useProjectStore, useLLMStore, useUIStore } from '@/stores';
import type { Language, WizardData, LLMWizardConfig } from '@/types';
import { LLM_PROVIDERS } from '@/constants';
import WizardStep from './WizardStep';
import StepLanguage from './StepLanguage';
import StepFramework from './StepFramework';
import StepDatabase from './StepDatabase';
import StepORM from './StepORM';
import StepArchitecture from './StepArchitecture';
import StepLLMProvider, { defaultConfig } from './StepLLMProvider';

const TOTAL_STEPS = 6;

const STEP_META = [
  { title: 'Choose Language', subtitle: 'Select the primary programming language for your project' },
  { title: 'Choose Framework', subtitle: 'Pick a framework that fits your needs' },
  { title: 'Choose Database', subtitle: 'Select your data storage solution' },
  { title: 'Choose ORM', subtitle: 'Pick a data access layer for your database' },
  { title: 'Choose Architecture', subtitle: 'Define the structural pattern for your codebase' },
  { title: 'Configure AI Providers', subtitle: 'Set up LLM providers for code generation and AI assistance' },
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>({
    language: null,
    framework: null,
    database: null,
    orm: null,
    architecture: null,
    llmProviders: Object.fromEntries(
      LLM_PROVIDERS.map((p) => [p.id, defaultConfig(p.id)])
    ),
  });

  const { setProject } = useProjectStore();
  const { setConfigs } = useLLMStore();
  const { setPhase } = useUIStore();

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const canProceed = (() => {
    switch (step) {
      case 0: return !!data.language;
      case 1: return !!data.framework;
      case 2: return !!data.database;
      case 3: return data.database === 'none' || !!data.orm;
      case 4: return !!data.architecture;
      case 5: return Object.values(data.llmProviders).some((c) => c.enabled);
      default: return false;
    }
  })();

  const handleLanguageChange = (lang: Language) => {
    update({ language: lang, framework: null, orm: null });
  };

  const handleDatabaseChange = (db: string) => {
    update({ database: db, orm: db === 'none' ? null : data.orm });
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const project = await projectsApi.create(
        `${data.framework}-${data.architecture}-project`,
        {
          language: data.language!,
          framework: data.framework!,
          database: data.database === 'none' ? null : data.database,
          orm: data.orm,
          architecture: data.architecture!,
        }
      );
      setProject(project);

      const enabledProviders = Object.entries(data.llmProviders).filter(
        ([, cfg]) => cfg.enabled
      );
      const configs = await Promise.all(
        enabledProviders.map(([providerId, cfg]) =>
          llmApi.create(project.id, {
            provider: providerId,
            model: cfg.model,
            api_key: cfg.apiKey,
            base_url: cfg.baseUrl || undefined,
            temperature: cfg.temperature,
          })
        )
      );
      setConfigs(configs);
      setPhase('canvas');
    } catch (err) {
      console.error('Failed to create project:', err);
      setPhase('canvas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepLanguage value={data.language} onChange={handleLanguageChange} />;
      case 1:
        return <StepFramework language={data.language} value={data.framework} onChange={(fw) => update({ framework: fw })} />;
      case 2:
        return <StepDatabase value={data.database} onChange={handleDatabaseChange} />;
      case 3:
        return <StepORM language={data.language} database={data.database} value={data.orm} onChange={(orm) => update({ orm })} />;
      case 4:
        return <StepArchitecture value={data.architecture} onChange={(arch) => update({ architecture: arch })} />;
      case 5:
        return (
          <StepLLMProvider
            configs={data.llmProviders}
            onChange={(llmProviders: Record<string, LLMWizardConfig>) => update({ llmProviders })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Logo header — clickable, returns to dashboard */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center gap-3 px-6 py-4">
        <button
          onClick={() => setPhase('dashboard')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          title="Back to dashboard"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--forge-glow)', border: '1px solid rgba(249,115,22,0.3)' }}>
            ⚒️
          </div>
          <span className="text-zinc-100 font-bold text-sm font-display tracking-wide">FlowForge</span>
        </button>
      </div>

      <WizardStep
        step={step}
        totalSteps={TOTAL_STEPS}
        title={STEP_META[step].title}
        subtitle={STEP_META[step].subtitle}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed && !isSubmitting}
        nextLabel={isSubmitting ? 'Forging...' : undefined}
      >
        {renderStep()}
      </WizardStep>
    </div>
  );
}
