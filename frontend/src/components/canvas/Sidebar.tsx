/** Left sidebar — forge-styled component palette for drag-and-drop. */

import { useState } from 'react';
import { useUIStore } from '@/stores';
import { NODE_TYPES } from '@/constants';
import type { NodeType } from '@/types';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [search, setSearch] = useState('');

  const filtered = NODE_TYPES.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = filtered.reduce<Record<string, typeof NODE_TYPES>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex flex-col shrink-0 transition-all duration-300"
      style={{
        width: sidebarCollapsed ? 56 : 240,
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 min-h-[44px] px-3 py-2.5" style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={toggleSidebar} className="text-zinc-500 hover:text-forge-400 hover:bg-forge-500/10 rounded-lg p-1 transition-colors">
          {sidebarCollapsed ? '▸' : '◂'}
        </button>
        {!sidebarCollapsed && <span className="text-[10px] font-display font-bold tracking-[2px] uppercase text-zinc-500">Components</span>}
      </div>

      {/* Collapsed: icon strip */}
      {sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-1 py-2">
          {NODE_TYPES.map((t) => (
            <div
              key={t.type}
              draggable
              onDragStart={(e) => onDragStart(e, t.type)}
              title={t.name}
              className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-base cursor-grab shrink-0 transition-all hover:scale-110"
              style={{ background: 'var(--surface-2)', border: `1.5px solid ${t.color}20` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${t.color}12`; e.currentTarget.style.borderColor = `${t.color}50`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = `${t.color}20`; }}
            >
              {t.icon}
            </div>
          ))}
        </div>
      )}

      {/* Expanded: full list */}
      {!sidebarCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3.5 py-2.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2.5 py-1.5 rounded-lg text-zinc-200 text-xs outline-none font-mono placeholder:text-zinc-600"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
            />
            <p className="text-[9px] text-zinc-600 text-center mt-1.5 font-mono tracking-wide">drag onto canvas</p>
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 pb-4">
            {Object.entries(categories).map(([cat, types]) => (
              <div key={cat} className="mt-3.5">
                <p className="text-[9px] font-display font-bold tracking-[2px] uppercase text-zinc-600 px-1 mb-1.5">{cat}</p>
                {types.map((t) => (
                  <div
                    key={t.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.type)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab mb-0.5 transition-all hover:translate-x-0.5"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${t.color}08`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}
                    >
                      {t.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{t.name}</p>
                      <p className="text-[10px] text-zinc-600">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
