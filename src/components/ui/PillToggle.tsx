'use client';

export function PillToggleGroup<T extends string>({
  value, onChange, options,
}:{
  value: T | null;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <label key={o.value}
               className={`fm-pill cursor-pointer ${value === o.value ? 'ring-2 ring-violet-500/50' : ''}`}>
          <input
            type="radio" className="fm-radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
