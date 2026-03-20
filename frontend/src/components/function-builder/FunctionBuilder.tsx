/** Main Function Builder layout: code (left 60%) + prompt/history (right 40%). */

import { useEffect, useMemo, useState } from 'react';
import type { FunctionRevision } from '@/types';
import { useFlowStore, useProjectStore } from '@/stores';
import { useFunctionStore } from '@/stores/useFunctionStore';
import CodeEditor from './CodeEditor';
import FunctionSignatureEditor from './FunctionSignatureEditor';
import PromptInput from './PromptInput';
import RevisionTimeline from './RevisionTimeline';

export default function FunctionBuilder() {
  const project = useProjectStore((s) => s.project);
  const {
    activeFunction,
    revisions,
    loadRevisions,
    updateFunction,
    restoreRevision,
  } = useFunctionStore();

  const { nodes, edges } = useFlowStore();
  const [selectedRevision, setSelectedRevision] = useState<FunctionRevision | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const connectedTypes = useMemo(() => {
    if (!activeFunction) return [];
    const nodeId = activeFunction.node_id;
    const connectedNodeIds = edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => (e.source === nodeId ? e.target : e.source));
    const dataNodeTypes = new Set(['dto', 'entity', 'response']);
    return nodes
      .filter((n) => connectedNodeIds.includes(n.id) && dataNodeTypes.has(n.data.nodeType))
      .map((n) => n.data.label || n.data.nodeType)
      .filter((label, i, arr) => arr.indexOf(label) === i);
  }, [activeFunction, nodes, edges]);

  useEffect(() => {
    if (project && activeFunction) {
      loadRevisions(project.id, activeFunction.id);
    }
  }, [project, activeFunction, loadRevisions]);

  if (!activeFunction || !project) return null;

  const handleSignatureChange = (data: Record<string, unknown>) => {
    updateFunction(project.id, activeFunction.id, data);
  };

  const handleCodeChange = (code: string) => {
    updateFunction(project.id, activeFunction.id, { current_code: code });
  };

  const handleRestore = (revisionId: string) => {
    restoreRevision(project.id, activeFunction.id, revisionId);
    setSelectedRevision(null);
  };

  const language = project.config.language;
  const isPreviewing = !!selectedRevision;

  return (
    <div className="flex h-full">
      {/* Left: Code Editor (60%) */}
      <div className="w-[60%] flex flex-col" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        {/* Function header */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
        >
          <span className="text-[10px] font-mono text-orange-400/70">fn</span>
          <span className="text-sm font-mono font-bold text-zinc-100">{activeFunction.name}</span>
          <span className="text-xs font-mono text-zinc-500">
            ({activeFunction.params.map((p) => `${p.name}: ${p.type}`).join(', ')})
          </span>
          <span className="text-xs font-mono text-zinc-600">&rarr; {activeFunction.return_type}</span>
          <div className="flex-1" />
          <button
            onClick={() => setShowSignature(!showSignature)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-display uppercase tracking-wider transition-colors"
          >
            {showSignature ? 'Hide Signature' : 'Edit Signature'}
          </button>
        </div>

        {/* Signature editor (collapsible) */}
        {showSignature && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
            <FunctionSignatureEditor
              name={activeFunction.name}
              params={activeFunction.params}
              returnType={activeFunction.return_type}
              description={activeFunction.description}
              connectedTypes={connectedTypes}
              onChange={handleSignatureChange}
            />
          </div>
        )}

        {/* Revision preview banner */}
        {isPreviewing && (
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{
              background: 'rgba(249, 115, 22, 0.08)',
              borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
            }}
          >
            <span className="text-[10px] font-mono text-orange-400">
              Previewing revision #{selectedRevision.revision_number}
            </span>
            <span className="text-[10px] text-zinc-500 truncate flex-1">
              {selectedRevision.prompt}
            </span>
            <button
              onClick={() => handleRestore(selectedRevision.id)}
              className="px-3 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                boxShadow: '0 0 12px rgba(249,115,22,0.3)',
              }}
            >
              Activate
            </button>
            <button
              onClick={() => setSelectedRevision(null)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Code */}
        <div className="flex-1 overflow-auto">
          <CodeEditor
            value={isPreviewing ? selectedRevision.code : activeFunction.current_code}
            onChange={isPreviewing ? undefined : handleCodeChange}
            readOnly={isPreviewing}
            language={language}
          />
        </div>
      </div>

      {/* Right: Prompt + History (40%) */}
      <div className="w-[40%] flex flex-col overflow-y-auto" style={{ background: 'var(--surface-1)' }}>
        <div className="px-4 py-4 space-y-4">
          <PromptInput functionId={activeFunction.id} />

          <RevisionTimeline
            revisions={revisions}
            onRestore={handleRestore}
            onSelect={setSelectedRevision}
            selectedId={selectedRevision?.id}
          />
        </div>
      </div>
    </div>
  );
}
