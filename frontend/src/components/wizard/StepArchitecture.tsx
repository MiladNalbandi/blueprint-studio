/** Step 5: Choose architecture pattern. */

import { ARCHITECTURES } from '@/constants';
import type { Architecture } from '@/types';
import SelectCard from './SelectCard';

interface Props {
  value: Architecture | null;
  onChange: (arch: Architecture) => void;
}

export default function StepArchitecture({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 stagger-children">
      {ARCHITECTURES.map((arch) => (
        <SelectCard
          key={arch.id}
          icon={arch.icon}
          name={arch.name}
          description={arch.description}
          color={arch.color}
          selected={value === arch.id}
          onClick={() => onChange(arch.id)}
        />
      ))}
    </div>
  );
}
