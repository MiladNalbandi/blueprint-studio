/** Method list shown in the config panel with + Add button. */

import { useEffect, useState } from 'react';
import type { FunctionDefinition } from '@/types';
import { useProjectStore, useUIStore } from '@/stores';
import { useFunctionStore } from '@/stores/useFunctionStore';

interface Props {
  nodeId: string;
}

export default function FunctionList({ nodeId }: Props) {
  const project = useProjectStore((s) => s.project);
  const { setShowFunctionBuilder } = useUIStore();
  const { functions, loadFunctions, createFunction, setActiveFunction } = useFunctionStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const nodeFunctions = functions[nodeId] || [];

  useEffect(() => {
    if (project) {
      loadFunctions(project.id, nodeId);
    }
  }, [project, nodeId, loadFunctions]);

  const handleAdd = async () => {
    if (!newName.trim() || !project) return;
    await createFunction(project.id, nodeId, newName.trim());
    setNewName('');
    setAdding(false);
  };

  const handleOpen = (func: FunctionDefinition) => {
    setActiveFunction(func);
    setShowFunctionBuilder(true, func.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">
          Functions
        </label>
        <button
          onClick={() => setAdding(!adding)}
          className="text-[10px] text-cyan-500/60 hover:text-cyan-400 font-bold transition-colors"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-1.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="functionName"
            autoFocus
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          />
          <button
            onClick={handleAdd}
            className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {nodeFunctions.length === 0 && !adding && (
        <p className="text-[10px] text-zinc-600">No functions yet</p>
      )}

      <div className="space-y-1">
        {nodeFunctions.map((func) => (
          <button
            key={func.id}
            onClick={() => handleOpen(func)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left group transition-all hover:scale-[1.01]"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-[10px] font-mono text-orange-400/70">fn</span>
            <span className="text-xs text-zinc-200 font-mono flex-1 truncate">{func.name}</span>
            {func.is_ai_generated && (
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316' }}
              >
                AI
              </span>
            )}
            <span className="text-zinc-600 group-hover:text-zinc-400 text-[10px] transition-colors">&rarr;</span>
          </button>
        ))}
      </div>
    </div>
  );
}
