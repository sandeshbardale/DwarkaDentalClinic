import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Send, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationsPage() {
  const { role } = useAuth();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [upcomingCount, setUpcomingCount] = useState(null);

  useEffect(() => {
    // Show how many reminders would be sent tomorrow
    api.getAppointments({ view: 'upcoming', limit: 1 })
      .then(res => {
        const total = res.data?.pagination?.total || 0;
        setUpcomingCount(total);
      })
      .catch(() => {});
  }, []);

  async function handleSendReminders() {
    if (!confirm('Send WhatsApp reminders to all patients with appointments tomorrow?')) return;
    setSending(true); setResult(null);
    try {
      const res = await api.sendWhatsAppReminders();
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Notifications</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">WhatsApp appointment reminders</p>
      </div>

      {/* WhatsApp Reminder Dispatch */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Send size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Send Tomorrow's Reminders</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Sends WhatsApp messages to all patients with appointments scheduled for tomorrow.
              {upcomingCount !== null && ` (${upcomingCount} upcoming appointments)`}
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 space-y-1">
          <p className="font-medium">⚠️ Important Notes</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>Reminders are sent only once per appointment (dedup enabled)</li>
            <li>Requires Twilio credentials in Backend/.env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)</li>
            <li>Without Twilio credentials, reminders are logged to <code className="font-mono text-xs">Backend/reminders.log</code></li>
          </ul>
        </div>

        <button
          onClick={handleSendReminders}
          disabled={sending}
          className="btn btn-primary flex items-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
          {sending ? 'Sending Reminders…' : 'Send Reminders Now'}
        </button>

        {result && !result.error && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="font-medium text-emerald-800 flex items-center gap-2">
              <CheckCheck size={16} /> Reminders Dispatched
            </p>
            <p className="text-sm text-emerald-700 mt-1">{result.processedCount} reminder(s) sent.</p>
            {result.details?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                {result.details.slice(0, 5).map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {d.simulated ? '📝' : '✅'} {d.patientName} ({d.phone}) — {d.simulated ? 'Logged' : 'Sent'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {result?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
