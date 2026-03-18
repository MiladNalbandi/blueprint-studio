/** Layout wrapper for each wizard step — forge aesthetic with progress, title, nav. */

interface WizardStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  nextLabel?: string;
}

export default function WizardStep({
  step, totalSteps, title, subtitle, children, onNext, onBack, canProceed, nextLabel,
}: WizardStepProps) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12" style={{ background: 'var(--surface-0)' }}>
      {/* Ambient forge glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-10 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono text-zinc-500 tracking-wider uppercase">
            Step {step + 1} / {totalSteps}
          </span>
          <span className="text-[11px] font-mono text-forge-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f97316, #ea580c, #dc2626)',
              boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <h2 className="text-3xl font-bold text-zinc-100 font-display tracking-tight mb-3">{title}</h2>
        <p className="text-zinc-500 text-sm">{subtitle}</p>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl flex-1 mb-10 relative z-10">{children}</div>

      {/* Navigation */}
      <div className="flex items-center gap-4 relative z-10">
        {step > 0 && (
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl text-zinc-400 text-sm font-medium transition-all hover:text-zinc-100"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-forge px-10 py-3 rounded-xl text-white text-sm font-bold tracking-wide disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none font-display"
        >
          {nextLabel || (step === totalSteps - 1 ? 'Forge Project →' : 'Continue →')}
        </button>
      </div>
    </div>
  );
}
