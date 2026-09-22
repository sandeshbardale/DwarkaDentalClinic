import { forwardRef } from 'react';

/**
 * Input component with label, error state, and helper text.
 */
const Input = forwardRef(function Input({ label, id, error, helperText, required, className = '', ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined}
        className={`form-input ${error ? 'error' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
});

export default Input;

/** Textarea variant */
export const Textarea = forwardRef(function Textarea({ label, id, error, helperText, required, className = '', ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={`form-textarea ${error ? 'border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-500 mt-0.5" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
});
