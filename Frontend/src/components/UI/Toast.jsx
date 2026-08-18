import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { removeToast } from '../../app/store';

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-blue-500" />,
};

function Toast({ id, type = 'info', message, title }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), 4000);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  return (
    <div className="flex items-start gap-3 bg-white border border-[var(--color-border)] rounded-lg shadow-lg p-4 min-w-72 max-w-sm animate-slide-right">
      <span className="mt-0.5 flex-shrink-0">{ICONS[type] || ICONS.info}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>}
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      </div>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] flex-shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useSelector(state => state.ui);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(t => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}
