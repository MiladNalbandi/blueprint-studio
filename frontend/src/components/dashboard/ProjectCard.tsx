/** Project card — displays project summary with tech badges matching TopBar style. */

import type { Project } from '@/types';
import { LANGUAGES, ARCHITECTURES } from '@/constants';
import { getTechIcon } from '@/lib/techIcons';

interface ProjectCardProps {
  project: Project;
  isLoading: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function ProjectCard({ project, isLoading, onSelect, onDelete }: ProjectCardProps) {
  const { config } = project;
  const langDef = LANGUAGES.find((l) => l.id === config.language);
  const archDef = ARCHITECTURES.find((a) => a.id === config.architecture);
  const fwDef = langDef?.frameworks.find((f) => f.id === config.framework);

  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className="w-full text-left rounded-xl p-4 transition-all group disabled:opacity-60"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 30px rgba(249,115,22,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-100 font-display tracking-wide truncate pr-2">
          {project.name}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-zinc-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors shrink-0"
          title="Delete project"
        >
          ✕
        </button>
      </div>

      {/* Tech badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {langDef && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium inline-flex items-center gap-1"
            style={{ color: langDef.color, borderColor: `${langDef.color}30`, background: `${langDef.color}08` }}
          >
            {getTechIcon(langDef.id) ?? langDef.icon} {langDef.name}
            {fwDef ? ` · ${fwDef.name}` : ''}
          </span>
        )}
        {archDef && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium"
            style={{ color: archDef.color, borderColor: `${archDef.color}30`, background: `${archDef.color}08` }}
          >
            {archDef.icon} {archDef.name}
          </span>
        )}
      </div>

      {/* Date */}
      <p className="text-[10px] font-mono text-zinc-600">
        {new Date(project.created_at).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
        })}
      </p>
    </button>
  );
}
