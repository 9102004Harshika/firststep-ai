import { QUICK_PRESETS } from '../utils/jobHelpers.js';

export default function QuickFilters({ filters, onChange }) {
  const activeId = QUICK_PRESETS.find((preset) =>
    Object.entries(preset.patch).every(([key, value]) => {
      if (value === '' || value == null) return true;
      return String(filters[key] ?? '') === String(value);
    }),
  )?.id;

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_PRESETS.map((preset) => {
        const active = activeId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              onChange({
                city: '',
                role: '',
                employmentType: '',
                experienceLevel: '',
                fresherEligible: '',
                remote: '',
                ...preset.patch,
              })
            }
            className={[
              'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
              active
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-white text-ink-soft hover:border-accent/40 hover:text-accent',
            ].join(' ')}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
