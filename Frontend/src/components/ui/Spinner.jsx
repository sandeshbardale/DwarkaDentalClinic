import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, className = '' }) {
  return (
    <Loader2
      size={size}
      className={`animate-spin-slow text-[var(--color-primary-500)] ${className}`}
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Spinner size={32} />
    </div>
  );
}
