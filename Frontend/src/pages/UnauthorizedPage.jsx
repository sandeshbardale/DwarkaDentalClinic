import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">Access Denied</h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          You don't have permission to view this page. Please contact your administrator or return to your dashboard.
        </p>
        <Link to="/login" className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition-colors">
          Go to Login
        </Link>
      </div>
    </div>

  );
}
