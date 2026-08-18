/**
 * Card component primitives.
 */
export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h2 className={`text-base font-semibold text-[var(--color-text)] ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

/** KPI metric card with icon, label, value, and optional trend. */
export function KPICard({ label, value, icon: Icon, iconColor = 'text-[var(--color-primary-500)]', iconBg = 'bg-[var(--color-primary-50)]', trend, trendLabel, className = '' }) {
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-[var(--color-text-muted)]';

  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-[var(--color-text)] leading-none">{value}</p>
          {trendLabel && (
            <p className={`text-xs mt-1.5 ${trendColor}`}>{trendLabel}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={20} className={iconColor} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
