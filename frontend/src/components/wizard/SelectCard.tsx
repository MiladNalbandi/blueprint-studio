/** Reusable selection card for wizard steps — forge aesthetic. */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SelectCardProps {
  icon: ReactNode;
  name: string;
  description?: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}

export default function SelectCard({ icon, name, description, color, selected, onClick }: SelectCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-center group',
        selected
          ? 'forge-glow-strong'
          : 'hover:translate-y-[-2px]'
      )}
      style={{
        background: selected
          ? `linear-gradient(145deg, ${color}12, var(--surface-1))`
          : 'var(--surface-1)',
        borderColor: selected ? `${color}80` : 'var(--border-subtle)',
        boxShadow: selected
          ? `0 0 40px ${color}20, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: selected ? 1 : 0,
        }}
      />

      {/* Checkmark */}
      {selected && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg"
          style={{ background: color, boxShadow: `0 0 12px ${color}60` }}
        >
          ✓
        </div>
      )}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-2deg]"
        style={{
          color,
          background: `${color}10`,
          border: `1.5px solid ${color}30`,
          boxShadow: selected ? `0 0 20px ${color}15` : 'none',
        }}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-zinc-100 font-display tracking-wide">{name}</span>
      {description && <span className="text-[11px] text-zinc-500 leading-relaxed">{description}</span>}
    </button>
  );
}
