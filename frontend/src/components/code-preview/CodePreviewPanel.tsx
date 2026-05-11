/** Full-screen Code Preview panel — file tree, code viewer, terminal, endpoint tester. */

import { useEffect, useMemo, useCallback, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore, useProjectStore } from '@/stores';
import { useCodePreviewStore } from '@/stores/useCodePreviewStore';
import { generateApi } from '@/api/client';
import CodeEditor from '@/components/function-builder/CodeEditor';
import FileTree from './FileTree';
import LogTerminal from './LogTerminal';
import EndpointTester from './EndpointTester';

function languageFromPath(path: string): string | undefined {
  if (path.endsWith('.php')) return 'php';
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.go')) return 'go';
  if (path.endsWith('.rs')) return 'rust';
  if (path.endsWith('.java')) return 'java';
  return undefined;
}

// Stacks that have Jinja2 template generators in the backend
const SUPPORTED_TEMPLATE_STACKS: Array<{ language: string; framework: string }> = [
  { language: 'php', framework: 'symfony' },
  { language: 'typescript', framework: 'fastify' },
  { language: 'python', framework: 'fastapi' },
  { language: 'typescript', framework: 'nestjs' },
  { language: 'go', framework: 'gin' },
  { language: 'java', framework: 'spring' },
];

function hasTemplateSupport(language?: string, framework?: string): boolean {
  if (!language || !framework) return false;
  const lang = language.toLowerCase();
  const fw = framework.toLowerCase();
  return SUPPORTED_TEMPLATE_STACKS.some((s) => s.language === lang && fw.includes(s.framework));
}

export default function CodePreviewPanel() {
  const { showCodePreview, setShowCodePreview } = useUIStore();
  const project = useProjectStore((s) => s.project);
  const {
    files,
    selectedFile,
    isGenerating,
    generateError,
    generatedBy,
    generationPhase,
    errorType,
    logs,
    runner,
    activeBottomTab,
    generatePreview,
    selectFile,
    startRunner,
    stopRunner,
    clearLogs,
    setActiveBottomTab,
  } = useCodePreviewStore();

  const [bottomHeight, setBottomHeight] = useState(220);
  const [isResizing, setIsResizing] = useState(false);

  const handleClose = () => {
    setShowCodePreview(false);
  };

  // Auto-generate on open if no files loaded (and no prior error)
  useEffect(() => {
    if (showCodePreview && project && files.length === 0 && !isGenerating && !generateError) {
      generatePreview(project.id);
    }
  }, [showCodePreview, project, files.length, isGenerating, generateError, generatePreview]);

  const selectedContent = useMemo(() => {
    const file = files.find((f) => f.path === selectedFile);
    return file?.content || '';
  }, [files, selectedFile]);

  const selectedLanguage = useMemo(() => {
    return selectedFile ? languageFromPath(selectedFile) : undefined;
  }, [selectedFile]);

  const handleRegenerate = useCallback(() => {
    if (project) generatePreview(project.id);
  }, [project, generatePreview]);

  const handleRun = useCallback(() => {
    if (project) startRunner(project.id);
  }, [project, startRunner]);

  const handleStop = useCallback(() => {
    if (project) stopRunner(project.id);
  }, [project, stopRunner]);

  const handleDownload = useCallback(async () => {
    if (!project) return;
    try {
      await generateApi.generate(project.id);
    } catch {
      // generate() triggers the download internally
    }
  }, [project]);

  // Resize handler for bottom panel
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = bottomHeight;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setBottomHeight(Math.max(100, Math.min(500, startHeight + delta)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [bottomHeight]);

  const isTemplate = hasTemplateSupport(project?.config?.language, project?.config?.framework);

  // Phase-aware loading subtext
  const loadingSubtext = useMemo(() => {
    if (generationPhase === 'converting') return 'Building IR...';
    if (generationPhase === 'generating') {
      return isTemplate ? 'Rendering templates...' : 'Generating via AI...';
    }
    return '';
  }, [generationPhase, isTemplate]);

  const phaseLabel = generationPhase === 'converting' ? 'Converting Flow' : 'Generating Code';

  // Whether the error is retryable
  const isRetryable = errorType === 'llm-failure' || errorType === 'parse-error' || errorType === 'generic';

  return (
    <Dialog.Root open={showCodePreview} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed inset-3 z-50 flex flex-col rounded-xl overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-5 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}
            >
              <span className="text-[10px] font-bold text-cyan-400">&lt;/&gt;</span>
            </div>
            <Dialog.Title className="text-sm font-display font-bold text-zinc-100 tracking-wide">
              Code Preview
            </Dialog.Title>
            {project && (
              <span className="text-xs font-mono text-zinc-500">{project.name}</span>
            )}
            <span className="text-[10px] font-mono text-zinc-600">{files.length} files</span>

            {/* Generated-by badge */}
            {files.length > 0 && generatedBy === 'llm' && (
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/25"
                title="Code was generated using an AI model because no template generator exists for this stack"
              >
                AI Generated
              </span>
            )}
            {files.length > 0 && generatedBy === 'template' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/25">
                Template
              </span>
            )}

            <div className="flex-1" />

            {/* Action buttons */}
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider text-zinc-400 transition-all hover:text-cyan-400 hover:bg-cyan-500/5 disabled:opacity-40 flex items-center gap-1.5"
              style={{ border: '1px solid var(--border)' }}
            >
              {isGenerating && (
                <span className="inline-block w-3 h-3 rounded-full border-2 border-zinc-600 border-t-cyan-400 animate-spin" />
              )}
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider text-zinc-400 transition-all hover:text-zinc-200 hover:bg-white/5"
              style={{ border: '1px solid var(--border)' }}
            >
              Download ZIP
            </button>

            {!runner.running ? (
              <button
                onClick={handleRun}
                disabled={files.length === 0}
                className="px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 0 12px rgba(34,197,94,0.2)',
                }}
              >
                Run
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 0 12px rgba(239,68,68,0.2)',
                }}
              >
                Stop
              </button>
            )}

            <Dialog.Close asChild>
              <button className="text-zinc-500 hover:text-zinc-200 text-lg px-2 py-1 rounded-lg transition-colors ml-1">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* ── Warning banner (files exist + warning text) ───── */}
          {generateError && files.length > 0 && (
            <div
              className="px-5 py-2 text-[11px] font-mono text-amber-400 shrink-0 flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}
            >
              <span className="text-amber-500">⚠</span>
              {generateError}
            </div>
          )}

          {/* ── Error banner (no files, error set) ─────────────── */}
          {generateError && files.length === 0 && errorType && (
            <div
              className="px-5 py-2 text-[11px] font-mono text-red-400 shrink-0 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}
            >
              <span className="text-red-500">✕</span>
              <span className="flex-1">{generateError}</span>
              {isRetryable && (
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wider text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  style={{ border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* ── Runner error banner (separate) ─────────────────── */}
          {runner.error && (
            <div
              className="px-5 py-2 text-[11px] font-mono text-red-400 shrink-0"
              style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}
            >
              {runner.error}
            </div>
          )}

          {/* ── Main content ───────────────────────────────────── */}
          <div className="flex-1 flex overflow-hidden">
            {/* File tree (left) */}
            <div
              className="w-56 shrink-0 overflow-hidden flex flex-col"
              style={{ borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}
            >
              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">
                  Files
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3 pt-8 px-3">
                    {/* Spinner */}
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-cyan-400 animate-spin" />
                    {/* Phase label */}
                    <span className="text-[11px] font-display font-bold text-zinc-300 tracking-wide">
                      {phaseLabel}
                    </span>
                    {/* Subtext */}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {loadingSubtext}
                    </span>
                    {/* Skeleton file rows */}
                    <div className="w-full mt-3 space-y-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-5 rounded animate-pulse"
                          style={{
                            background: 'var(--surface-1)',
                            width: `${70 + (i % 3) * 10}%`,
                            animationDelay: `${i * 150}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <FileTree files={files} selectedPath={selectedFile} onSelect={selectFile} />
                )}
              </div>
            </div>

            {/* Right side: code + bottom panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Code editor (top) */}
              <div className="flex-1 overflow-hidden">
                {selectedFile ? (
                  <div className="h-full flex flex-col">
                    {/* File path breadcrumb */}
                    <div
                      className="px-4 py-1.5 flex items-center gap-2 shrink-0"
                      style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}
                    >
                      {selectedFile.split('/').map((part, i, arr) => (
                        <span key={i} className="flex items-center gap-2">
                          {i > 0 && <span className="text-zinc-700 text-[10px]">/</span>}
                          <span className={`text-[11px] font-mono ${i === arr.length - 1 ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {part}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <CodeEditor
                        value={selectedContent}
                        readOnly
                        language={selectedLanguage}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ContextEmptyState
                      errorType={errorType}
                      generateError={generateError}
                      isGenerating={isGenerating}
                      filesExist={files.length > 0}
                      projectConfig={project?.config}
                      onClose={handleClose}
                      onRegenerate={handleRegenerate}
                    />
                  </div>
                )}
              </div>

              {/* Resize handle */}
              <div
                className={`h-1 shrink-0 cursor-row-resize transition-colors ${
                  isResizing ? 'bg-orange-500/30' : 'hover:bg-orange-500/20'
                }`}
                style={{ borderTop: '1px solid var(--border-subtle)' }}
                onMouseDown={onResizeStart}
              />

              {/* Bottom panel: tabs */}
              <div className="shrink-0 flex flex-col overflow-hidden" style={{ height: bottomHeight }}>
                {/* Tab bar */}
                <div className="flex items-center gap-0 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setActiveBottomTab('terminal')}
                    className={`px-4 py-2 text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
                      activeBottomTab === 'terminal'
                        ? 'text-orange-400 border-b-2 border-orange-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Terminal
                    {runner.running && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-2" style={{ boxShadow: '0 0 6px #22c55e50' }} />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveBottomTab('endpoints')}
                    className={`px-4 py-2 text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
                      activeBottomTab === 'endpoints'
                        ? 'text-orange-400 border-b-2 border-orange-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Endpoints
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden" style={{ background: 'var(--surface-0)' }}>
                  {activeBottomTab === 'terminal' ? (
                    <LogTerminal logs={logs} running={runner.running} onClear={clearLogs} />
                  ) : (
                    <EndpointTester />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Context-sensitive empty state ─────────────────────────

function ContextEmptyState({
  errorType,
  generateError,
  isGenerating,
  filesExist,
  projectConfig,
  onClose,
  onRegenerate,
}: {
  errorType: string | null;
  generateError: string | null;
  isGenerating: boolean;
  filesExist: boolean;
  projectConfig?: { language: string; framework: string } | null;
  onClose: () => void;
  onRegenerate: () => void;
}) {
  if (filesExist) {
    return (
      <div className="text-center">
        <p className="text-zinc-600 text-sm font-mono">Select a file to view</p>
      </div>
    );
  }

  if (isGenerating) return null;

  if (errorType === 'empty-flow') {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-2xl text-zinc-600">⊘</span>
        </div>
        <p className="text-zinc-300 text-sm font-display font-bold">Your flow is empty</p>
        <p className="text-zinc-500 text-xs font-mono">Add nodes to your canvas before generating code.</p>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          style={{ border: '1px solid rgba(34,211,238,0.25)' }}
        >
          Back to Canvas
        </button>
      </div>
    );
  }

  if (errorType === 'missing-llm-config') {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-2xl text-zinc-600">⚙</span>
        </div>
        <p className="text-zinc-300 text-sm font-display font-bold">LLM Configuration Required</p>
        <p className="text-zinc-500 text-xs font-mono max-w-xs">
          {projectConfig
            ? `No template generator exists for ${projectConfig.language}/${projectConfig.framework}. `
            : ''}
          Configure an LLM provider to generate code with AI.
        </p>
        <button
          onClick={() => useUIStore.getState().setShowLLMSettings(true)}
          className="mt-2 px-4 py-2 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider text-purple-300 hover:bg-purple-500/10 transition-colors"
          style={{ border: '1px solid rgba(168,85,247,0.25)' }}
        >
          Configure LLM
        </button>
      </div>
    );
  }

  if (errorType === 'llm-failure' || errorType === 'parse-error' || errorType === 'generic') {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <span className="text-2xl text-red-500">!</span>
        </div>
        <p className="text-zinc-300 text-sm font-display font-bold">Generation Failed</p>
        {generateError && (
          <p className="text-zinc-500 text-xs font-mono max-w-sm">{generateError}</p>
        )}
        <button
          onClick={onRegenerate}
          className="mt-2 px-4 py-2 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10 transition-colors"
          style={{ border: '1px solid rgba(239,68,68,0.25)' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Default: no error, no files
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-zinc-800/50 border border-zinc-700/50 mb-3">
        <span className="text-lg text-zinc-600">&lt;/&gt;</span>
      </div>
      <p className="text-zinc-600 text-sm font-mono">Generate code to preview</p>
    </div>
  );
}
