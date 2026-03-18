/** Step 3: Choose database. */

import { DATABASES } from '@/constants';
import { getTechIcon } from '@/lib/techIcons';
import SelectCard from './SelectCard';

interface Props {
  value: string | null;
  onChange: (db: string) => void;
}

export default function StepDatabase({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {DATABASES.map((db) => (
        <SelectCard
          key={db.id}
          icon={getTechIcon(db.id) ?? db.icon}
          name={db.name}
          description={db.description}
          color={db.color}
          selected={value === db.id}
          onClick={() => onChange(db.id)}
        />
      ))}
    </div>
  );
}
