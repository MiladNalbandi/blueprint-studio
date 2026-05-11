/** Full-screen modal container for the Function Builder. */

import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore } from '@/stores';
import { useFunctionStore } from '@/stores/useFunctionStore';
import FunctionBuilder from './FunctionBuilder';

export default function FunctionBuilderModal() {
  const { showFunctionBuilder, setShowFunctionBuilder } = useUIStore();
  const { activeFunction, setActiveFunction } = useFunctionStore();

  const handleClose = () => {
    setShowFunctionBuilder(false);
    setActiveFunction(null);
  };

  return (
    <Dialog.Root open={showFunctionBuilder} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed inset-4 z-50 flex flex-col rounded-xl overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Modal header */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <span className="text-[10px] font-bold text-orange-400">fn</span>
            </div>
            <Dialog.Title className="text-sm font-display font-bold text-zinc-100 tracking-wide">
              Function Builder
            </Dialog.Title>
            {activeFunction && (
              <span className="text-xs font-mono text-zinc-500">
                {activeFunction.name}
              </span>
            )}
            <div className="flex-1" />
            <Dialog.Close asChild>
              <button className="text-zinc-500 hover:text-zinc-200 text-lg px-2 py-1 rounded-lg transition-colors">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* Builder content */}
          <div className="flex-1 overflow-hidden">
            <FunctionBuilder />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
