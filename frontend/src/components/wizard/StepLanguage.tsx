/** Step 1: Choose programming language. */

import { LANGUAGES } from '@/constants';
import type { Language } from '@/types';
import { getTechIcon } from '@/lib/techIcons';
import SelectCard from './SelectCard';

interface Props {
  value: Language | null;
  onChange: (lang: Language) => void;
}

export default function StepLanguage({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {LANGUAGES.map((lang) => (
        <SelectCard
          key={lang.id}
          icon={getTechIcon(lang.id) ?? lang.icon}
          name={lang.name}
          color={lang.color}
          selected={value === lang.id}
          onClick={() => onChange(lang.id)}
        />
      ))}
    </div>
  );
}
