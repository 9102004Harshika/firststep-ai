import { NavLink, Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  CircleCheckBig,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import { formatRelative } from '../utils/format.js';

const navLinkClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-ink-soft hover:bg-white/80 hover:text-ink',
  ].join(' ');

export default function Header() {
  const { health, lastUpdated } = useApp();
  const { savedList, applicationList } = useJobWorkspace();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white shadow-sm transition group-hover:bg-accent">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span>
            <span className="block font-display text-lg leading-none font-semibold tracking-tight text-ink">
              FirstStep AI
            </span>
            <span className="mt-0.5 block text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
              Land faster
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Explore
            </span>
          </NavLink>
          <NavLink to="/saved" className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Saved
              {savedList.length ? (
                <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-bold text-accent">
                  {savedList.length}
                </span>
              ) : null}
            </span>
          </NavLink>
          <NavLink to="/tracker" className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <CircleCheckBig className="h-3.5 w-3.5" />
              Tracker
              {applicationList.length ? (
                <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-bold text-accent">
                  {applicationList.length}
                </span>
              ) : null}
            </span>
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </span>
          </NavLink>
          <NavLink to="/health" className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Pipeline
            </span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Last updated
            </p>
            <p className="text-sm font-medium text-ink-soft">
              {lastUpdated ? formatRelative(lastUpdated) : '—'}
            </p>
          </div>
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              health.status === 'ok'
                ? 'bg-success-soft text-success'
                : health.status === 'loading' || health.status === 'idle'
                  ? 'bg-warning-soft text-warning'
                  : 'bg-danger-soft text-danger',
            ].join(' ')}
            title={health.error || 'API health'}
          >
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                health.status === 'ok'
                  ? 'bg-success'
                  : health.status === 'loading' || health.status === 'idle'
                    ? 'bg-warning'
                    : 'bg-danger',
              ].join(' ')}
            />
            {health.status === 'ok'
              ? 'Live'
              : health.status === 'loading' || health.status === 'idle'
                ? 'Checking'
                : 'Offline'}
          </span>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-4 py-2 lg:hidden">
        <NavLink to="/" end className={navLinkClass}>
          Explore
        </NavLink>
        <NavLink to="/saved" className={navLinkClass}>
          Saved
        </NavLink>
        <NavLink to="/tracker" className={navLinkClass}>
          Tracker
        </NavLink>
        <NavLink to="/analytics" className={navLinkClass}>
          Analytics
        </NavLink>
        <NavLink to="/health" className={navLinkClass}>
          Pipeline
        </NavLink>
      </nav>
    </header>
  );
}
