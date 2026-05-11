/** Editor for entity node — table name + columns, relations, indexes. Forge-styled. */

import { useState } from 'react';
import { useFlowStore } from '@/stores';
import type { FlowNodeData } from '@/types';

interface Column {
  name: string;
  type: string;
  primary?: boolean;
  nullable?: boolean;
  unique?: boolean;
  defaultValue?: string;
}

interface Relation {
  type: 'belongsTo' | 'hasOne' | 'hasMany' | 'manyToMany';
  target: string;
  foreignKey?: string;
  pivotTable?: string;
}

interface Index {
  name?: string;
  columns: string[];
  unique?: boolean;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const COLUMN_TYPES = ['integer', 'bigint', 'string', 'text', 'boolean', 'float', 'decimal', 'date', 'datetime', 'json', 'uuid'];
const RELATION_TYPES: Relation['type'][] = ['belongsTo', 'hasOne', 'hasMany', 'manyToMany'];

/* ── Tiny reusable bits ─────────────────────────────────── */

function SectionHeader({ label, count, open, onToggle, onAdd }: {
  label: string; count: number; open: boolean;
  onToggle: () => void; onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 cursor-pointer select-none group" onClick={onToggle}>
      <span className="text-[10px] text-zinc-500 transition-transform" style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : undefined }}>
        ▶
      </span>
      <span className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">
        {label}
      </span>
      {count > 0 && (
        <span className="text-[9px] text-zinc-600 font-mono">({count})</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="ml-auto text-[10px] text-cyan-500/60 hover:text-cyan-400 font-bold transition-colors"
      >
        +
      </button>
    </div>
  );
}

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase transition-all"
      style={{
        height: 20,
        background: active ? 'rgba(6,182,212,0.15)' : 'var(--surface-0)',
        border: `1px solid ${active ? 'rgba(6,182,212,0.5)' : 'var(--border-subtle)'}`,
        color: active ? '#22d3ee' : '#71717a',
        boxShadow: active ? '0 0 8px rgba(6,182,212,0.25)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

const inputCls = 'px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none';
const inputStyle = { background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' };

/* ── Main component ─────────────────────────────────────── */

export default function EntityEditor({ config, onChange }: Props) {
  const tableName = (config.tableName as string) || '';
  const fields = (config.fields as Column[]) || [];
  const relations = (config.relations as Relation[]) || [];
  const indexes = (config.indexes as Index[]) || [];

  const { nodes } = useFlowStore();

  // Other entity names on the canvas (for relation target dropdown)
  const entityNames = nodes
    .filter((n) => (n.data as FlowNodeData).nodeType === 'entity')
    .map((n) => ((n.data as FlowNodeData).config.tableName as string) || (n.data as FlowNodeData).label)
    .filter((name) => name && name !== tableName);

  // Current entity's column names (for FK and index dropdowns)
  const columnNames = fields.map((f) => f.name).filter(Boolean);

  const [openSections, setOpenSections] = useState({ columns: true, relations: true, indexes: true });
  const [expandedCol, setExpandedCol] = useState<number | null>(null);

  const toggle = (s: keyof typeof openSections) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  /* ── Column helpers ──────────────────────────── */
  const updateField = (i: number, patch: Partial<Column>) => {
    const updated = fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    onChange({ ...config, fields: updated });
  };
  const addField = () => onChange({ ...config, fields: [...fields, { name: '', type: 'string' }] });
  const removeField = (i: number) => {
    onChange({ ...config, fields: fields.filter((_, idx) => idx !== i) });
    if (expandedCol === i) setExpandedCol(null);
    else if (expandedCol !== null && expandedCol > i) setExpandedCol(expandedCol - 1);
  };

  /* ── Relation helpers ────────────────────────── */
  const updateRelation = (i: number, patch: Partial<Relation>) => {
    const updated = relations.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange({ ...config, relations: updated });
  };
  const addRelation = () => onChange({ ...config, relations: [...relations, { type: 'belongsTo', target: '' }] });
  const removeRelation = (i: number) => onChange({ ...config, relations: relations.filter((_, idx) => idx !== i) });

  /* ── Index helpers ───────────────────────────── */
  const updateIndex = (i: number, patch: Partial<Index>) => {
    const updated = indexes.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
    onChange({ ...config, indexes: updated });
  };
  const addIndex = () => onChange({ ...config, indexes: [...indexes, { columns: [], unique: false }] });
  const removeIndex = (i: number) => onChange({ ...config, indexes: indexes.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {/* Table Name */}
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">Table Name</label>
        <input
          value={tableName}
          onChange={(e) => onChange({ ...config, tableName: e.target.value })}
          placeholder="users"
          className={`w-full ${inputCls}`}
          style={inputStyle}
        />
      </div>

      {/* ─── Columns Section ─────────────────────── */}
      <div>
        <SectionHeader label="Columns" count={fields.length} open={openSections.columns} onToggle={() => toggle('columns')} onAdd={addField} />
        {openSections.columns && (
          <div className="space-y-1 mt-1.5">
            {fields.map((field, i) => (
              <div key={i}>
                {/* Main column row */}
                <div className="flex items-center gap-2">
                  <input
                    value={field.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    placeholder="column"
                    className={`flex-1 ${inputCls}`}
                    style={inputStyle}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                    className={`${inputCls}`}
                    style={inputStyle}
                  >
                    {COLUMN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {field.primary ? (
                    <span
                      className="text-[9px] text-forge-400 font-bold font-mono cursor-pointer"
                      style={{ textShadow: '0 0 8px rgba(249,115,22,0.3)' }}
                      onClick={() => setExpandedCol(expandedCol === i ? null : i)}
                    >
                      PK
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedCol(expandedCol === i ? null : i)}
                        className="text-zinc-600 hover:text-cyan-400 text-[10px] px-0.5 transition-colors"
                        title="Column details"
                      >
                        ...
                      </button>
                      <button
                        onClick={() => removeField(i)}
                        className="text-zinc-600 hover:text-red-400 text-sm px-0.5 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                {/* Detail row (accordion) */}
                {expandedCol === i && (
                  <div
                    className="flex items-center gap-2 mt-1 ml-2 pl-2"
                    style={{ borderLeft: '2px solid var(--border-subtle)' }}
                  >
                    <Pill active={field.nullable ?? false} label="NULL" onClick={() => updateField(i, { nullable: !field.nullable })} />
                    <Pill active={field.unique ?? false} label="UNQ" onClick={() => updateField(i, { unique: !field.unique })} />
                    <span className="text-[9px] text-zinc-600 font-mono ml-1">default:</span>
                    <input
                      value={field.defaultValue ?? ''}
                      onChange={(e) => updateField(i, { defaultValue: e.target.value || undefined })}
                      placeholder="now()"
                      className={`w-24 ${inputCls} !py-1 !text-[10px]`}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={addField}
              className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              + Add Column
            </button>
          </div>
        )}
      </div>

      {/* ─── Relations Section ───────────────────── */}
      <div>
        <SectionHeader label="Relations" count={relations.length} open={openSections.relations} onToggle={() => toggle('relations')} onAdd={addRelation} />
        {openSections.relations && (
          <div className="space-y-2 mt-1.5">
            {relations.map((rel, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <select
                    value={rel.type}
                    onChange={(e) => updateRelation(i, { type: e.target.value as Relation['type'] })}
                    className={`${inputCls}`}
                    style={inputStyle}
                  >
                    {RELATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-zinc-600 text-[10px]">&rarr;</span>
                  <select
                    value={rel.target}
                    onChange={(e) => updateRelation(i, { target: e.target.value })}
                    className={`flex-1 ${inputCls}`}
                    style={inputStyle}
                  >
                    <option value="">select entity...</option>
                    {entityNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    {/* Keep current value visible even if not in list */}
                    {rel.target && !entityNames.includes(rel.target) && (
                      <option value={rel.target}>{rel.target}</option>
                    )}
                  </select>
                  <button
                    onClick={() => removeRelation(i)}
                    className="text-zinc-600 hover:text-red-400 text-sm px-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {/* Extra fields for FK / pivot */}
                {(rel.type === 'manyToMany' || rel.foreignKey !== undefined) && (
                  <div
                    className="flex items-center gap-2 ml-2 pl-2"
                    style={{ borderLeft: '2px solid var(--border-subtle)' }}
                  >
                    <span className="text-[9px] text-zinc-600 font-mono">FK:</span>
                    <select
                      value={rel.foreignKey ?? ''}
                      onChange={(e) => updateRelation(i, { foreignKey: e.target.value || undefined })}
                      className={`w-28 ${inputCls} !py-1 !text-[10px]`}
                      style={inputStyle}
                    >
                      <option value="">select column...</option>
                      {columnNames.map((c) => <option key={c} value={c}>{c}</option>)}
                      {rel.foreignKey && !columnNames.includes(rel.foreignKey) && (
                        <option value={rel.foreignKey}>{rel.foreignKey}</option>
                      )}
                    </select>
                    {rel.type === 'manyToMany' && (
                      <>
                        <span className="text-[9px] text-zinc-600 font-mono">Pivot:</span>
                        <input
                          value={rel.pivotTable ?? ''}
                          onChange={(e) => updateRelation(i, { pivotTable: e.target.value || undefined })}
                          placeholder="user_roles"
                          className={`w-24 ${inputCls} !py-1 !text-[10px]`}
                          style={inputStyle}
                        />
                      </>
                    )}
                  </div>
                )}
                {/* Show FK row toggle for non-manyToMany */}
                {rel.type !== 'manyToMany' && rel.foreignKey === undefined && (
                  <button
                    onClick={() => updateRelation(i, { foreignKey: '' })}
                    className="text-[9px] text-zinc-600 hover:text-cyan-400 ml-2 transition-colors"
                  >
                    + foreign key
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addRelation}
              className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              + Add Relation
            </button>
          </div>
        )}
      </div>

      {/* ─── Indexes Section ─────────────────────── */}
      <div>
        <SectionHeader label="Indexes" count={indexes.length} open={openSections.indexes} onToggle={() => toggle('indexes')} onAdd={addIndex} />
        {openSections.indexes && (
          <div className="space-y-2 mt-1.5">
            {indexes.map((idx, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  multiple
                  value={idx.columns ?? []}
                  onChange={(e) => updateIndex(i, {
                    columns: Array.from(e.target.selectedOptions, (o) => o.value),
                  })}
                  className={`flex-1 ${inputCls} !py-1`}
                  style={{ ...inputStyle, minHeight: 28, maxHeight: 60 }}
                >
                  {columnNames.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Pill active={idx.unique ?? false} label="UNQ" onClick={() => updateIndex(i, { unique: !idx.unique })} />
                <button
                  onClick={() => removeIndex(i)}
                  className="text-zinc-600 hover:text-red-400 text-sm px-0.5 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addIndex}
              className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              + Add Index
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
