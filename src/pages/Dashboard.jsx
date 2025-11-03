// src/pages/Dashboard.jsx
import { useMemo, useState } from 'react';
import StatCard from '../components/StateCard.jsx';
import PieCard from '../components/PieCards.jsx';

import { FiUserCheck, FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { FaWallet, FaFlask } from 'react-icons/fa';

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function BarChartCard({ title, data, yPrefix = '$' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card">
      <div className="chart-title">{title}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          height: 260,
          padding: '16px 8px 0 8px',
        }}
      >
        {data.map((d) => {
          const h = (d.value / max) * 210 + 4;
          return (
            <div
              key={d.label}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}
            >
              <div
                title={`${d.label}: ${yPrefix}${d.value}`}
                style={{ width: 24, height: h, background: 'var(--primary-600)', borderRadius: 6 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>{d.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>Total Revenue Generated</div>
    </div>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState({ start: '2025-11-01', end: '2025-11-03' });

  const stats = [
    { label: 'Total Pending Payout', value: fmtCurrency(137), icon: <FaWallet /> },
    { label: 'Total Active Collectors', value: 0, icon: <FiUserCheck /> },
    { label: 'Total Labs', value: 0, icon: <FaFlask /> },
    { label: 'Total Customers', value: 0, icon: <FiUsers /> },
    { label: 'Total Appointments', value: 0, icon: <FiCalendar /> },
    { label: 'Total Revenue', value: fmtCurrency(38), icon: <FiDollarSign /> },
  ];

  const pie = [
    { name: 'Test', value: 12 },
    { name: 'Packages', value: 5 },
  ];

  const revenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m) => ({ label: m, value: m === 'Nov' ? 38 : 0 }));
  }, []);

  return (
    <main style={{ padding: 18, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <input
          type="date"
          value={range.start}
          onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}
        />
        <span style={{ color: 'var(--muted)' }}>to</span>
        <input
          type="date"
          value={range.end}
          onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}
        />
        <button
          type="button"
          style={{
            padding: '8px 14px',
            background: 'var(--primary-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
          onClick={() => {}}
        >
          Submit
        </button>
      </div>

      <div className="grid" style={{ alignItems: 'stretch' }}>
        <div className="cols-8">
          <div className="grid">
            {stats.slice(0, 3).map((s) => (
              <div key={s.label} className="cols-4">
                <StatCard label={s.label} value={s.value} icon={s.icon} />
              </div>
            ))}
            {stats.slice(3).map((s) => (
              <div key={s.label} className="cols-4" style={{ marginTop: 18 }}>
                <StatCard label={s.label} value={s.value} icon={s.icon} />
              </div>
            ))}
          </div>
        </div>

        <div className="cols-4">
          <div style={{ height: '100%', minHeight: 330 }}>
            <PieCard title="Proportion Of Appointments: Tests Vs Packages" data={pie} />
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <div className="cols-12">
          <BarChartCard title="Monthly Revenue Trend" data={revenue} yPrefix="$" />
        </div>
      </div>
    </main>
  );
}
