// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import StatCard from '../components/StateCard.jsx';
import PieCard from '../components/PieCards.jsx';
import "./Dashboard.css";

import {
  collection, query, where, getDocs,
  getCountFromServer, getAggregateFromServer, sum, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

import { FiUserCheck, FiUsers, FiCalendar, FiDollarSign, FiEye } from 'react-icons/fi';
import { FaWallet, FaFlask } from 'react-icons/fa';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function toTs(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (endOfDay) d.setHours(23,59,59,999);
  return Timestamp.fromDate(d);
}

// Small avatar initials used in the prescriptions table
function Avatar({ name }) {
  const initials = (name || '')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        background: 'var(--primary-50, #eef2ff)',
        color: 'var(--primary-700, #4338ca)',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      {initials || '?'}
    </div>
  );
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

  const [totals, setTotals] = useState({
    allAppointments: 0,
    activeCollectors: 0,
    labs: 0,
    customers: 0,
    revenue: 0,
  });

  const [pie, setPie] = useState([
    { name: 'Test', value: 0 },
    { name: 'Packages', value: 0 },
  ]);

  const [revenueSeries, setRevenueSeries] = useState(MONTHS.map((m) => ({ label: m, value: 0 })));
  const [appointments, setAppointments] = useState([]);

  // NEW: dashboard cards data
  const [pendingCollectors, setPendingCollectors] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);

  const stats = useMemo(() => ([
    { label: 'Total Pending Payout', value: fmtCurrency(137), icon: <FaWallet /> },
    { label: 'Total Active Collectors', value: totals.activeCollectors, icon: <FiUserCheck /> },
    { label: 'Total Labs', value: totals.labs, icon: <FaFlask /> },
    { label: 'Total Customers', value: totals.customers, icon: <FiUsers /> },
    { label: 'Total Appointments', value: totals.allAppointments, icon: <FiCalendar /> },
    { label: 'Total Revenue', value: fmtCurrency(totals.revenue), icon: <FiDollarSign /> },
  ]), [totals]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const startTs = toTs(range.start, false);
      const endTs = toTs(range.end, true);

      const filters = [];
      if (startTs) filters.push(where('createdAt', '>=', startTs));
      if (endTs) filters.push(where('createdAt', '<=', endTs));

      const apptCol = collection(db, 'appointments');
      const apptQuery = query(apptCol, ...filters);

      const allTimeSnap = await getCountFromServer(apptCol);
      const allTimeCount = allTimeSnap.data().count || 0;
      if (!cancelled) {
        setTotals(prev => ({ ...prev, allAppointments: allTimeCount }));
      }

      try {
        const [testsSnap, packagesSnap] = await Promise.all([
          getCountFromServer(query(apptCol, ...filters, where('type', '==', 'test'))),
          getCountFromServer(query(apptCol, ...filters, where('type', '==', 'package'))),
        ]);

        const revAgg = await getAggregateFromServer(apptQuery, { totalRevenue: sum('amount') });
        const revenue = Number(revAgg.data().totalRevenue || 0);

        const docsSnap = await getDocs(apptQuery);
        const items = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const monthly = MONTHS.map((m) => ({ label: m, value: 0 }));
        for (const a of items) {
          const dt = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const m = dt instanceof Date && !isNaN(dt) ? dt.getMonth() : 0;
          monthly[m].value += Number(a.amount || 0);
        }

        const customersCount = (await getCountFromServer(collection(db, 'customers'))).data().count || 0;
        const labsCount = (await getCountFromServer(collection(db, 'labs'))).data().count || 0;
        const collectorsCount = (
          await getCountFromServer(query(collection(db, 'collectors'), where('status', '==', 'active')))
        ).data().count || 0;

        // NEW: fetch pending collectors (status == 'pending')
        const pendingCollectorsSnap = await getDocs(
          query(collection(db, 'collectors'), where('status', '==', 'pending'))
        );
        const pendingCollectorsRows = pendingCollectorsSnap.docs.map(d => {
          const data = d.data() || {};
          const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ') || d.id;
          return { id: d.id, name };
        });

        // NEW: fetch prescriptions pending review
        const pendingPrescriptionsSnap = await getDocs(
          query(collection(db, 'prescriptions'), where('status', '==', 'pending_review'))
        );
        const pendingPrescriptionsRows = pendingPrescriptionsSnap.docs.map(d => {
          const p = d.data() || {};
          const when = p.date?.toDate ? p.date.toDate() : (p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.date || p.createdAt));
          return {
            id: d.id,
            name: p.customerName || p.name || 'Unknown',
            email: p.customerEmail || p.email || '',
            date: when instanceof Date && !isNaN(when) ? when.toISOString().slice(0, 10) : '',
          };
        });

        if (cancelled) return;

        setTotals(prev => ({
          ...prev,
          activeCollectors: collectorsCount,
          labs: labsCount,
          customers: customersCount,
          revenue,
        }));

        setPie([
          { name: 'Test', value: testsSnap.data().count || 0 },
          { name: 'Packages', value: packagesSnap.data().count || 0 },
        ]);

        setRevenueSeries(monthly);
        setAppointments(items);
        setPendingCollectors(pendingCollectorsRows);
        setPendingPrescriptions(pendingPrescriptionsRows);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };

    run().catch(console.error);
    return () => { cancelled = true; };
  }, [range]);

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
          <BarChartCard title="Monthly Revenue Trend" data={revenueSeries} yPrefix="$" />
        </div>
      </div>

      {/* NEW: Two cards row */}
      <div className="grid" style={{ marginTop: 18 }}>
        {/* Pending Collector Approval */}
        <div className="cols-6">
          <div className="card">
            <h3 className="chart-title">Pending Collector Approval</h3>
            <div style={{ padding: 12 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border)', borderRadius: 10 }} aria-label="Pending Collector Approval">
                <thead>
                  <tr style={{ background: 'var(--primary-600)', color: '#fff' }}>
                    <th scope="col" style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                    <th scope="col" style={{ textAlign: 'right', padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCollectors.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px' }}>
                        No Data Available
                      </td>
                    </tr>
                  ) : (
                    pendingCollectors.map((row) => (
                      <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>{row.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button type="button" className="icon-btn" aria-label="View" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f3f4f6', color: 'var(--primary-700, #4338ca)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Review Prescriptions */}
        <div className="cols-6">
          <div className="card">
            <h3 className="chart-title">Pending Review Prescriptions</h3>
            <div style={{ padding: 12 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border)', borderRadius: 10 }} aria-label="Pending Review Prescriptions">
                <thead>
                  <tr style={{ background: 'var(--primary-600)', color: '#fff' }}>
                    <th scope="col" style={{ textAlign: 'left', padding: '12px 16px' }}>Customer Name</th>
                    <th scope="col" style={{ textAlign: 'left', padding: '12px 16px' }}>Prescription Date</th>
                    <th scope="col" style={{ textAlign: 'right', padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px' }}>
                        No Data Available
                      </td>
                    </tr>
                  ) : (
                    pendingPrescriptions.map((row) => (
                      <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={row.name} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{row.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{row.date}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button type="button" className="icon-btn" aria-label="View" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f3f4f6', color: 'var(--primary-700, #4338ca)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
