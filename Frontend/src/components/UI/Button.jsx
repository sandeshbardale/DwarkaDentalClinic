import { Loader2 } from 'lucide-react';

/**
 * Button component.
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer select-none';

  const variants = {
    primary: 'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] focus-visible:outline-[var(--color-primary-500)] shadow-sm',
    secondary: 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] active:bg-[var(--color-border)] shadow-sm',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-red-600 active:bg-red-700 focus-visible:outline-red-500 shadow-sm',
    ghost: 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] active:bg-[var(--color-border)]',
    outline: 'border border-[var(--color-primary-500)] text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] active:bg-[var(--color-primary-100)]',
  };

  const sizes = {
    sm: 'text-xs px-3 h-8',
    md: 'text-sm px-4 h-9',
    lg: 'text-sm px-5 h-10',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin-slow" aria-hidden="true" />}
      {children}
    </button>
  );
}
