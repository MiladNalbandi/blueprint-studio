/** Step 2: Choose framework for selected language. */

import { LANGUAGES } from '@/constants';
import type { Language } from '@/types';
import { getTechIcon } from '@/lib/techIcons';
import SelectCard from './SelectCard';

interface Props {
  language: Language | null;
  value: string | null;
  onChange: (fw: string) => void;
}

export default function StepFramework({ language, value, onChange }: Props) {
  const langDef = LANGUAGES.find((l) => l.id === language);
  const frameworks = langDef?.frameworks ?? [];

  if (!frameworks.length) {
    return <p className="text-center text-zinc-500">Select a language first.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {frameworks.map((fw) => (
        <SelectCard
          key={fw.id}
          icon={getTechIcon(fw.id) ?? fw.icon}
          name={fw.name}
          color={langDef!.color}
          selected={value === fw.id}
          onClick={() => onChange(fw.id)}
        />
      ))}
    </div>
  );
}
