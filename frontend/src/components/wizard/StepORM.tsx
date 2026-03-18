/** Step 4: Choose ORM / data access layer. */

import { ORM_MAP, LANGUAGES } from '@/constants';
import type { Language } from '@/types';
import { getTechIcon } from '@/lib/techIcons';
import SelectCard from './SelectCard';

interface Props {
  language: Language | null;
  database: string | null;
  value: string | null;
  onChange: (orm: string) => void;
}

export default function StepORM({ language, database, value, onChange }: Props) {
  if (database === 'none' || !database) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-40">⏭️</div>
        <p className="text-zinc-300 text-lg font-display mb-2">No database selected</p>
        <p className="text-zinc-600 text-sm">You can skip this step and continue.</p>
      </div>
    );
  }

  const orms = language ? ORM_MAP[language] ?? [] : [];
  const langColor = LANGUAGES.find((l) => l.id === language)?.color ?? '#71717a';

  if (!orms.length) {
    return <p className="text-center text-zinc-500">No ORMs available for this language.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {orms.map((orm) => (
        <SelectCard
          key={orm.id}
          icon={getTechIcon(orm.id) ?? orm.icon}
          name={orm.name}
          color={langColor}
          selected={value === orm.id}
          onClick={() => onChange(orm.id)}
        />
      ))}
    </div>
  );
}
