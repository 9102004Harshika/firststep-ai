import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line/80 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          <span className="font-display font-semibold text-ink">FirstStep AI</span>
          {' — '}
          Verified fresher jobs & internships across India.
        </p>
        <div className="flex gap-4">
          <Link to="/analytics" className="hover:text-ink">
            Analytics
          </Link>
          <Link to="/health" className="hover:text-ink">
            Pipeline health
          </Link>
        </div>
      </div>
    </footer>
  );
}
