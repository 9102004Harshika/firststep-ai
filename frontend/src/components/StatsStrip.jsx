import { Building2, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { formatNumber } from '../utils/format.js';
import { StatsSkeleton } from './JobSkeleton.jsx';
import { PanelError } from './StateBlock.jsx';

const CARDS = [
  {
    key: 'earlyCareer',
    label: 'Early-career roles',
    icon: Briefcase,
    pick: (s) => s?.earlyCareer ?? s?.fresherEligible ?? s?.totalActive,
  },
  {
    key: 'internships',
    label: 'Internships',
    icon: GraduationCap,
    pick: (s) => s?.internships ?? s?.internshipCount,
  },
  {
    key: 'fresherEligible',
    label: 'Fresher-eligible',
    icon: Sparkles,
    pick: (s) => s?.fresherEligible ?? s?.fresherEligibleCount ?? s?.fresher,
  },
  {
    key: 'companies',
    label: 'Companies',
    icon: Building2,
    pick: (s) =>
      s?.companiesRepresented ?? s?.companies ?? s?.companyCount ?? s?.uniqueCompanies,
  },
];

export default function StatsStrip({ stats, status, error, onRetry }) {
  if (status === 'loading' || status === 'idle') {
    return <StatsSkeleton />;
  }

  if (status === 'error') {
    return <PanelError message={error || 'Failed to load stats'} onRetry={onRetry} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, pick }, index) => (
        <div
          key={key}
          className="animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {label}
            </p>
            <Icon className="h-4 w-4 text-accent/70" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
            {formatNumber(pick(stats))}
          </p>
        </div>
      ))}
    </div>
  );
}
