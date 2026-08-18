export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Clinic configuration and preferences</p>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Clinic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Clinic Name', value: 'Dwarka Dental Clinic' },
            { label: 'Registration Number', value: 'DEN-DL-2012-0847' },
            { label: 'Phone', value: '+91 11 2345 6789' },
            { label: 'Email', value: 'info@dwarkadental.com' },
            { label: 'Address', value: 'Sector 7, Dwarka, New Delhi 110075' },
            { label: 'Working Hours', value: 'Mon–Sat: 9 AM – 9 PM' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">{label}</label>
              <input defaultValue={value} className="form-input" readOnly />
            </div>
          ))}
        </div>
        <button className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors cursor-pointer opacity-60 cursor-not-allowed" disabled>
          Save Changes (coming soon)
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Notification Preferences</h2>
        {['Follow-up reminders', 'New appointment alerts', 'Cancellation alerts', 'Daily summary email'].map(pref => (
          <label key={pref} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0 cursor-pointer">
            <span className="text-sm text-[var(--color-text)]">{pref}</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        ))}
      </div>
    </div>
  );
}
