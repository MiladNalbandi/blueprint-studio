/** Floating chat bubble — forge-styled with ember glow. */

import { useChatStore } from '@/stores';

export default function ChatBubble() {
  const { isOpen, setOpen } = useChatStore();

  if (isOpen) return null;

  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl text-white text-xl z-40 flex items-center justify-center transition-all hover:scale-105 hover:rotate-[-3deg] animate-glow"
      style={{
        background: 'linear-gradient(135deg, #f97316, #ea580c, #dc2626)',
        boxShadow: '0 4px 24px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      💬
    </button>
  );
}
