/** Dependency management panel — full-screen overlay modal. */

import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore, useProjectStore } from '@/stores';
import { PACKAGE_MANAGERS, FRAMEWORK_DEFAULT_DEPS } from '@/constants';
import type { Language, Dependency } from '@/types';

export default function DependencyPanel() {
  const { showDependencyPanel, setShowDependencyPanel } = useUIStore();
  const project = useProjectStore((s) => s.project);

  const config = project?.config;
  const language = config?.language as Language | undefined;
  const framework = config?.framework;
  const pmId = config?.package_manager;

  const managers = language ? PACKAGE_MANAGERS[language] : [];
  const pmDef = managers.find((m) => m.id === pmId) ?? managers[0];

  const defaultDeps = framework ? (FRAMEWORK_DEFAULT_DEPS[framework] ?? []) : [];

  const [customDeps, setCustomDeps] = useState<Dependency[]>([]);
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('latest');
  const [newDev, setNewDev] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const allDeps = [...defaultDeps, ...customDeps];

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    if (allDeps.some((d) => d.name === name)) return;
    setCustomDeps((prev) => [...prev, { name, version: newVersion.trim() || 'latest', dev: newDev }]);
    setNewName('');
    setNewVersion('latest');
    setNewDev(false);
  }, [newName, newVersion, newDev, allDeps]);

  const handleRemove = (name: string) => {
    setCustomDeps((prev) => prev.filter((d) => d.name !== name));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  return (
    <Dialog.Root open={showDependencyPanel} onOpenChange={setShowDependencyPanel}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-4 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
              >
                {pmDef?.icon ?? '📦'}
              </div>
              <div>
                <h2 className="text-sm font-bold font-display text-zinc-100">Dependencies</h2>
                <p className="text-[11px] text-zinc-500">
                  {pmDef?.name ?? 'Package Manager'} &middot; {framework}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-zinc-500 hover:text-zinc-300 text-lg px-2">x</button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left — dependency list (65%) */}
            <div className="w-[65%] flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--border-subtle)' }}>
              {/* Add row */}
              <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Package name"
                  className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border bg-transparent text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500/50"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}
                />
                <input
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Version"
                  className="w-28 text-xs font-mono px-3 py-2 rounded-lg border bg-transparent text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500/50"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}
                />
                <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 cursor-pointer select-none">
                  <input type="checkbox" checked={newDev} onChange={(e) => setNewDev(e.target.checked)} className="accent-cyan-500" />
                  dev
                </label>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="text-[11px] font-display font-semibold px-3 py-2 rounded-lg transition-all text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(34,211,238,0.3)' }}
                >
                  + Add
                </button>
              </div>

              {/* Dependency list */}
              <div className="flex-1 overflow-y-auto">
                {allDeps.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-8">No dependencies configured.</p>
                )}
                {allDeps.map((dep) => (
                  <div
                    key={dep.name}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-xs font-mono text-zinc-200 flex-1">{dep.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{dep.version}</span>
                    {dep.dev && (
                      <span className="text-[9px] font-display font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        dev
                      </span>
                    )}
                    {dep.isDefault ? (
                      <span className="text-[9px] font-display font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemove(dep.name)}
                        className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors"
                        title="Remove"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — PM info (35%) */}
            <div className="w-[35%] overflow-y-auto p-5">
              {pmDef ? (
                <>
                  {/* PM card */}
                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{pmDef.icon}</span>
                      <span className="text-sm font-bold font-display text-zinc-100">{pmDef.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Config file</span>
                        <span className="font-mono text-zinc-300">{pmDef.configFile}</span>
                      </div>
                      {pmDef.lockFile && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Lock file</span>
                          <span className="font-mono text-zinc-300">{pmDef.lockFile}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commands reference */}
                  <div>
                    <h3 className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-3">
                      Commands Reference
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(pmDef.commands).map(([label, cmd]) => (
                        <div key={label}>
                          <span className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 block mb-1">
                            {label}
                          </span>
                          <button
                            onClick={() => handleCopy(cmd, label)}
                            className="w-full text-left text-[11px] font-mono px-3 py-2 rounded-lg transition-all hover:bg-white/[0.04] cursor-pointer"
                            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
                            title="Click to copy"
                          >
                            <span className="text-cyan-400">$</span>{' '}
                            <span className="text-zinc-300">{cmd}</span>
                            {copiedCmd === label && (
                              <span className="ml-2 text-[9px] text-green-400">copied!</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-8">No package manager configured.</p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
