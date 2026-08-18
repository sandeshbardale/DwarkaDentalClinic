import { MOCK_REVENUE } from '../../data/revenue';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/Card';
import { DollarSign, TrendingUp, Clock, RotateCcw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const { summary, monthly, byTreatment, recentTransactions } = MOCK_REVENUE;

export default function RevenuePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Revenue</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Financial overview — August 2024</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Monthly Revenue" value={formatCurrency(summary.monthly)} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" trendLabel="+3.2% vs last month" />
        <KPICard label="Weekly Revenue" value={formatCurrency(summary.weekly)} icon={TrendingUp} iconColor="text-[var(--color-primary-500)]" iconBg="bg-[var(--color-primary-50)]" />
        <KPICard label="Pending Payments" value={formatCurrency(summary.pendingPayments)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KPICard label="Refunds" value={formatCurrency(summary.refunds)} icon={RotateCcw} iconColor="text-red-500" iconBg="bg-red-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Monthly Revenue vs Target</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="var(--color-primary-500)" radius={[4,4,0,0]} name="Revenue" />
              <Bar dataKey="target" fill="var(--color-border)" radius={[4,4,0,0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Revenue by Treatment</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={byTreatment} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {byTreatment.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {byTreatment.map(t => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span className="text-[var(--color-text-muted)] truncate max-w-24">{t.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(t.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" aria-label="Transactions table">
            <thead>
              <tr><th>Date</th><th>Patient</th><th>Treatment</th><th>Amount</th><th>Method</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentTransactions.map(t => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td className="font-medium">{t.patientName}</td>
                  <td className="text-[var(--color-text-muted)]">{t.treatment}</td>
                  <td className="font-semibold">{formatCurrency(t.amount)}</td>
                  <td className="text-[var(--color-text-muted)]">{t.method}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
