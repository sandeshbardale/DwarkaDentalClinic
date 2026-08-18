import { ADMIN_DASHBOARD } from '../../data/dashboard';
import { MOCK_REVENUE } from '../../data/revenue';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function ReportsPage() {
  const { patientRegistrations, appointmentTrend, appointmentStatusDistribution, doctorWorkload } = ADMIN_DASHBOARD;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Reports & Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Clinic performance overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly appointment trend */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Weekly Appointment Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={appointmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" fill="#10b981" radius={[3,3,0,0]} name="Completed" />
              <Bar dataKey="scheduled" fill="#0b6ba7" radius={[3,3,0,0]} name="Scheduled" />
              <Bar dataKey="cancelled" fill="#ef4444" radius={[3,3,0,0]} name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient registrations trend */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Patient Registrations (2024)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={patientRegistrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#0d9c8e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 5 }} name="New Patients" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor workload */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Doctor Appointments This Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={doctorWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={110}
                tickFormatter={v => v.replace('Dr. ', '')} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="appointments" radius={[0,4,4,0]} name="Appointments">
                {doctorWorkload.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by treatment */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Revenue Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={MOCK_REVENUE.byTreatment} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {MOCK_REVENUE.byTreatment.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
