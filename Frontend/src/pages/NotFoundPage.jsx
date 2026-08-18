import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-[var(--color-primary-200)] mb-4">404</p>
        <div className="w-14 h-14 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center mx-auto mb-4">
          <SearchX size={24} className="text-[var(--color-text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2">Page not found</h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/login" className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition-colors">
          Return to Login
        </Link>
      </div>
    </div>
  );
}
