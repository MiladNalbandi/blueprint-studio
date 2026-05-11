/** Step 3: Choose package manager for selected language. */

import { PACKAGE_MANAGERS } from '@/constants';
import type { Language } from '@/types';
import SelectCard from './SelectCard';

interface Props {
  language: Language | null;
  value: string | null;
  onChange: (pm: string) => void;
}

export default function StepPackageManager({ language, value, onChange }: Props) {
  const managers = language ? PACKAGE_MANAGERS[language] : [];

  if (!managers.length) {
    return <p className="text-center text-zinc-500">Select a language first.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {managers.map((pm) => (
        <SelectCard
          key={pm.id}
          icon={pm.icon}
          name={pm.name}
          description={pm.configFile}
          color="#22d3ee"
          selected={value === pm.id}
          onClick={() => onChange(pm.id)}
        />
      ))}
    </div>
  );
}
