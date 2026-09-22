import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal dialog component with React Portal.
 * Fixed viewport placement, sticky header, scrollable body with explicit height rules.
 */
export default function Modal({ open, onClose, title, children, size = 'md', hideClose = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeStyles = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-lg',
    lg: 'w-full max-w-2xl',
    xl: 'w-full max-w-3xl',
  };

  const modalNode = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        style={{
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          opacity: 1,
          visibility: 'visible',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        className={`rounded-2xl border border-slate-200 w-full relative z-10 my-auto overflow-hidden ${sizeStyles[size]}`}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20 flex-shrink-0">
          <h2 id="modal-title" className="text-base font-bold text-slate-900">{title}</h2>
          {!hideClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            maxHeight: 'calc(85vh - 65px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
          className="p-6 flex-1 bg-white text-slate-900 space-y-4"
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

/** Confirm dialog shortcut */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="text-sm px-4 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`text-sm px-4 h-9 rounded-xl font-semibold text-white transition-colors cursor-pointer ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]'} disabled:opacity-60`}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
