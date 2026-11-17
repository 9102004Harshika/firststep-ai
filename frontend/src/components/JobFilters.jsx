import { Search, SlidersHorizontal, X } from 'lucide-react';
import QuickFilters from './QuickFilters.jsx';
import {
  CITY_OPTIONS,
  EMPLOYMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  ROLE_OPTIONS,
  SORT_OPTIONS,
} from '../utils/jobHelpers.js';

const selectClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15';

export default function JobFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
}) {
  return (
    <section className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          Search & filters
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-danger"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <QuickFilters filters={filters} onChange={onChange} />
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search title, company, keywords…"
          className="w-full rounded-xl border border-line bg-paper px-10 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Role
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.role}
            onChange={(e) => onChange({ role: e.target.value })}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          City
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value, remote: '' })}
          >
            <option value="">All cities</option>
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Experience
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.experienceLevel}
            onChange={(e) => onChange({ experienceLevel: e.target.value })}
          >
            <option value="">Any level</option>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Employment
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.employmentType}
            onChange={(e) => onChange({ employmentType: e.target.value })}
          >
            <option value="">Any type</option>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Fresher eligible
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.fresherEligible}
            onChange={(e) => onChange({ fresherEligible: e.target.value })}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Sort
          <select
            className={`mt-1.5 ${selectClass}`}
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value }, { resetPage: false })}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
