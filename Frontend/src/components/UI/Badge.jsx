/**
 * Badge — status pill component.
 * @param {Object} props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'|'primary'|'accent'} props.variant
 * @param {'sm'|'md'} props.size
 */
export default function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-600 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    primary: 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border border-[var(--color-primary-200)]',
    accent: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border border-[var(--color-accent-200)]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}

/** Maps appointment/patient status strings to badge variants. */
export function StatusBadge({ status }) {
  const map = {
    // Appointment statuses
    scheduled: { variant: 'info', label: 'Scheduled' },
    confirmed: { variant: 'primary', label: 'Confirmed' },
    'in-progress': { variant: 'warning', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    'no-show': { variant: 'neutral', label: 'No Show' },
    // Patient statuses
    new: { variant: 'accent', label: 'New' },
    active: { variant: 'success', label: 'Active' },
    'follow-up': { variant: 'warning', label: 'Follow-up' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    // Payment statuses
    paid: { variant: 'success', label: 'Paid' },
    pending: { variant: 'warning', label: 'Pending' },
    partial: { variant: 'info', label: 'Partial' },
    refunded: { variant: 'danger', label: 'Refunded' },
    // Staff/doctor
    'active-staff': { variant: 'success', label: 'Active' },
    inactive_staff: { variant: 'neutral', label: 'Inactive' },
    // Follow-up
    'due-today': { variant: 'danger', label: 'Due Today' },
    'due-tomorrow': { variant: 'warning', label: 'Due Tomorrow' },
    upcoming: { variant: 'info', label: 'Upcoming' },
  };

  const config = map[status] || { variant: 'neutral', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
