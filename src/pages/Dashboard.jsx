// src/pages/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import StatCard from '../components/StateCard.jsx';
import PieCard from '../components/PieCards.jsx';
import './Dashboard.css';
import ReactApexChart from 'react-apexcharts';

import {
  collection, query, where, getDocs,
  getCountFromServer, getAggregateFromServer, sum, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import styled from 'styled-components';

import { FiUserCheck, FiUsers, FiCalendar, FiDollarSign, FiEye } from 'react-icons/fi';
import { FaWallet, FaFlask } from 'react-icons/fa';
import { useAppointmentsBreakdown } from '../hooks/useAppointmentsBreakdown';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---------- helpers ----------
function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function toTs(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (endOfDay) d.setHours(23,59,59,999);
  return Timestamp.fromDate(d);
}

// amount fallback across common schemas
function pickAmount(a) {
  const candidates = [a.amount, a.totalAmount, a.price, a.total, a.grandTotal];
  for (const v of candidates) {
    const n = Number(v);
    if (!isNaN(n) && isFinite(n)) return n;
  }
  return 0;
}

// robust date extraction across fields + Timestamp|string support
function getDocDate(a) {
  const candidates = [a.createdAt, a.date, a.paidAt, a.updatedAt];
  for (const v of candidates) {
    if (!v) continue;
    const d = v.toDate ? v.toDate() : new Date(v);
    if (d instanceof Date && !isNaN(d)) return d;
  }
  return null;
}

// Format Date -> 'YYYY-MM-DD' for <input type="date">
function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse 'YYYY-MM-DD' -> Date (local)
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(dt) ? null : dt;
}

// Compute common preset ranges
function todayRange() {
  const today = new Date();
  const ymd = fmtYMD(today);
  return { start: ymd, end: ymd };
}
function lastNDaysRange(n) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(0, n - 1));
  return { start: fmtYMD(start), end: fmtYMD(end) };
}
function thisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: fmtYMD(start), end: fmtYMD(end) };
}

// Ensure start <= end and coerce to YMD strings
function normalizeRange(r) {
  const s = parseYMD(r.start) || new Date();
  const e = parseYMD(r.end) || s;
  const start = s <= e ? s : e;
  const end = e >= s ? e : s;
  return { start: fmtYMD(start), end: fmtYMD(end) };
}

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
        width: 40, height: 40, borderRadius: 999,
        background: 'var(--primary-50, #eef2ff)',
        color: 'var(--primary-700, #4338ca)',
        display: 'grid', placeItems: 'center',
        fontWeight: 700, border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      {initials || '?'}
    </div>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;

  /* mobile breakpoint */
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const TriggerButton = styled.button`
  height: 40px;
  min-width: 260px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel, #fff);
  color: var(--text, #111827);
  text-align: left;
  cursor: pointer;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SubmitButton = styled.button`
  height: 40px;
  padding: 0 16px;
  background: var(--primary-600, #4f46e5);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  @media (max-width: 600px) {
    width: 30%;
  }
`;

const Popover = styled.div`
  position: absolute;
  top: 46px;
  right: 0;
  z-index: 10;
  padding: 12px;
  width: clamp(280px, 90vw, 360px);
  background: var(--panel, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);

  @media (max-width: 600px) {
    right: auto;
    left: 0;
    width: 100%;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  color: var(--muted);
`;

const DateInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
`;

const PresetsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const PresetButton = styled.button`
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--panel);
  cursor: pointer;
`;

const ErrorText = styled.div`
  color: #b91c1c;
  font-size: 12px;
  margin-top: 8px;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

const GhostButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  height: 34px;
  padding: 0 12px;
  background: var(--primary-600, #4f46e5);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

const LayoutRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px; /* optional */
`;

const LeftCol = styled.div`
  flex: 0 0 66.6667%;
`;

const RightCol = styled.div`
  flex: 0 0 33.3333%;
`;

const StatsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: -9px; /* to balance the 9px inner padding if you want tight grid */
`;

const StatCol = styled.div`
  width: 33.3333%;
  padding: 9px;
`;

const StatColWithTopMargin = styled(StatCol)`
  margin-top: 18px;
`;

const PieWrapper = styled.div`
  height: 330px;
`;

/* -------- Top-right date range (popover) -------- */
function RangePicker({ range, onChange, onSubmit }) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Local buffer so queries only run on Apply
  const [tmp, setTmp] = useState(range);
  useEffect(() => {
    if (open) setTmp(range);
  }, [open, range]);

  const invalid = useMemo(() => {
    const s = parseYMD(tmp.start);
    const e = parseYMD(tmp.end);
    return !!(s && e && e < s);
  }, [tmp]);

  const humanLabel = useMemo(() => {
    const s = parseYMD(range.start);
    const e = parseYMD(range.end);
    const fmt = (d) =>
      d
        ? d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '';
    return `${fmt(s)} to ${fmt(e)}`;
  }, [range]);

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const apply = () => {
    const next = normalizeRange(tmp);
    onChange?.(next);
    onSubmit?.();
    setOpen(false);
  };

  const presets = [
    { label: 'Today', get: () => todayRange() },
    { label: 'Last 7 days', get: () => lastNDaysRange(7) },
    { label: 'Last 30 days', get: () => lastNDaysRange(30) },
    { label: 'This month', get: () => thisMonthRange() },
  ];

  return (
      <Wrapper>
      <TriggerButton
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Pick date range"
      >
        {humanLabel}
      </TriggerButton>

      <SubmitButton type="button" onClick={apply} disabled={invalid}>
        Submit
      </SubmitButton>

      {open && (
        <Popover
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label="Select date range"
        >
          <Row>
            <div style={{ flex: 1 }}>
              <Label>Start</Label>
              <DateInput
                type="date"
                value={tmp.start}
                onChange={e => setTmp(r => ({ ...r, start: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>End</Label>
              <DateInput
                type="date"
                value={tmp.end}
                onChange={e => setTmp(r => ({ ...r, end: e.target.value }))}
              />
            </div>
          </Row>

          <PresetsRow>
            {presets.map(p => (
              <PresetButton
                key={p.label}
                type="button"
                onClick={() => setTmp(normalizeRange(p.get()))}
              >
                {p.label}
              </PresetButton>
            ))}
          </PresetsRow>

          {invalid && (
            <ErrorText>
              End date cannot be before start date
            </ErrorText>
          )}

          <FooterRow>
            <GhostButton type="button" onClick={() => setOpen(false)}>
              Close
            </GhostButton>
            <PrimaryButton type="button" onClick={apply} disabled={invalid}>
              Apply
            </PrimaryButton>
          </FooterRow>
        </Popover>
      )}
    </Wrapper>
  );
}

/* -------- Bar chart (ApexCharts) -------- */
function BarChartCard({ title, data, yPrefix = '$' }) {
  const CURRENCY = 'USD';
  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 2,
  });

  const MONTH_FULL = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  };

  const categories = data.map(d => MONTH_FULL[d.label] || d.label);
  const series = [{ name: 'Revenue', data: data.map(d => Number(d.value || 0)) }];

  const options = {
    chart: {
      type: 'bar',
      toolbar: {
        show: true,
        tools: { download: true },
        export: {
          csv: { filename: (title || 'chart').replace(/\s+/g, '_') },
          png: { filename: (title || 'chart').replace(/\s+/g, '_') },
          svg: { filename: (title || 'chart').replace(/\s+/g, '_') },
        },
      },
      foreColor: 'var(--muted, #6b7280)',
      fontFamily:
        'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    },
    colors: ['#4f46e5'],
    plotOptions: {
      bar: { columnWidth: '40%', borderRadius: 6 },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'var(--border, #e5e7eb)',
      strokeDashArray: 3,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: -15 },
    },
    yaxis: {
      title: { text: 'Total Revenue Generated' },
      labels: {
        formatter: (val) => {
          const f = currencyFmt.format(val);
          return yPrefix && yPrefix !== '$' ? f.replace('$', yPrefix) : f;
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => currencyFmt.format(val) },
    },
    fill: {
      type: 'gradient',
      gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.9, opacityTo: 0.7 },
    },
    noData: { text: 'No data' },

    // Responsive overrides
    responsive: [
      {
        breakpoint: 1024,
        options: {
          plotOptions: { bar: { columnWidth: '55%' } },
          xaxis: { labels: { rotate: 0 } },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: { height: 260 },
          plotOptions: { bar: { columnWidth: '60%' } },
          xaxis: { labels: { rotate: 0 } },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  return (
    <div className="card">
      <div className="chart-title">{title}</div>
      <ReactApexChart options={options} series={series} type="bar" height={300} />
    </div>
  );
}

export default function Dashboard() {
  // hydrate initial range from URL or default to last 7 days
  const initialRange = useMemo(() => {
    const params = new URLSearchParams(window.location.search || '');
    const ps = params.get('start');
    const pe = params.get('end');
    if (ps && pe) return normalizeRange({ start: ps, end: pe });
    return normalizeRange(lastNDaysRange(7));
  }, []);

  const [range, setRange] = useState(initialRange);

  // keep URL in sync with range (no navigation)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('start', range.start);
    url.searchParams.set('end', range.end);
    window.history.replaceState({}, '', url);
  }, [range]);

  const [totals, setTotals] = useState({
    allAppointments: 0,
    activeCollectors: 0,
    labs: 0,
    customers: 0,
    revenue: 0,
  });

  const [revenueSeries, setRevenueSeries] = useState(
    MONTHS.map((m) => ({ label: m, value: 0 })),
  );
  const [appointments, setAppointments] = useState([]);
  const [pendingCollectors, setPendingCollectors] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);

  const defaultPie = useMemo(
    () => [
      { name: 'Test', value: 0 },
      { name: 'Packages', value: 0 },
    ],
    [],
  );

  // Switch to revenue share by passing { mode: 'revenue' }
  const { data: pie = defaultPie } = useAppointmentsBreakdown(db, range) || {};

  const stats = useMemo(
    () => [
      { label: 'Total Pending Payout', value: fmtCurrency(137), icon: <FaWallet /> },
      { label: 'Total Active Collectors', value: totals.activeCollectors, icon: <FiUserCheck /> },
      { label: 'Total Labs', value: totals.labs, icon: <FaFlask /> },
      { label: 'Total Customers', value: totals.customers, icon: <FiUsers /> },
      { label: 'Total Appointments', value: totals.allAppointments, icon: <FiCalendar /> },
      { label: 'Total Revenue', value: fmtCurrency(totals.revenue), icon: <FiDollarSign /> },
    ],
    [totals],
  );

  useEffect(() => {
    let cancelled = false;

    const safeCount = async (thunk) => {
      try {
        const snap = await thunk();
        return snap?.data?.().count || 0;
      } catch (e) {
        console.warn('Count failed:', e);
        return 0;
      }
    };

    const run = async () => {
      // Appointments base
      const apptCol = collection(db, 'appointments');

      // 0) All-time appointments (safe)
      const allTime = await safeCount(() => getCountFromServer(apptCol));
      if (!cancelled) setTotals((prev) => ({ ...prev, allAppointments: allTime }));

      // 1) Selected-range docs for fallback
      const startTs = toTs(range.start, false);
      const endTs = toTs(range.end, true);
      const filters = [];
      if (startTs) filters.push(where('createdAt', '>=', startTs));
      if (endTs) filters.push(where('createdAt', '<=', endTs));
      const apptQuery = query(apptCol, ...filters);

      let items = [];
      try {
        const docsSnap = await getDocs(apptQuery);
        items = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Appointments query failed:', e);
      }
      if (!cancelled) setAppointments(items);

      // 2) Revenue aggregation with local fallback
      let revenue = items.reduce((acc, a) => acc + pickAmount(a), 0);
      try {
        const revAgg = await getAggregateFromServer(apptQuery, { totalRevenue: sum('amount') });
        const aggVal = Number(revAgg.data().totalRevenue || 0);
        if (aggVal > 0) revenue = aggVal;
      } catch (e) {
        console.warn('Revenue aggregation failed, using fallback:', e);
      }

      // 3) Monthly trend (guarded)
      let monthly = MONTHS.map((m) => ({ label: m, value: 0 }));
      try {
        const now = new Date();
        const yStart = Timestamp.fromDate(new Date(now.getFullYear(), 0, 1));
        const yEnd = Timestamp.fromDate(new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999));
        const yearQ = query(
          apptCol,
          where('createdAt', '>=', yStart),
          where('createdAt', '<=', yEnd),
        );
        const yearSnap = await getDocs(yearQ);
        const yearItems = yearSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const tmp = MONTHS.map((m) => ({ label: m, value: 0 }));
        for (const a of yearItems) {
          const dt = getDocDate(a) || new Date(now.getFullYear(), 0, 1);
          const val = pickAmount(a);
          tmp[dt.getMonth()].value += val;
        }
        monthly = tmp;
      } catch (e) {
        console.warn('Monthly trend failed:', e);
      }

      // 4) Other counts in parallel, with schema-aligned fallbacks
      const [
        usersCustomersRes,
        customersColRes,
        labsRes,
        collectorsStatusActiveRes,
        collectorsIsActiveRes,
        collectorsStatusRes,
        pendingCollectorsRes,
        pendingPrescriptionsRes,
      ] = await Promise.allSettled([
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'customer'))),
        getCountFromServer(collection(db, 'customers')),
        getCountFromServer(collection(db, 'labs')),
        getCountFromServer(query(collection(db, 'collectors'), where('statusActive', '==', true))),
        getCountFromServer(query(collection(db, 'collectors'), where('isActive', '==', true))),
        getCountFromServer(query(collection(db, 'collectors'), where('status', '==', 'active'))),
        getDocs(query(collection(db, 'collectors'), where('status', '==', 'pending'))),
        getDocs(
          query(collection(db, 'prescriptions'), where('status', '==', 'pending_review')),
        ),
      ]);

      const pickSettledCount = (r) =>
        r.status === 'fulfilled' ? r.value?.data?.().count || 0 : 0;

      const customersFromUsers = pickSettledCount(usersCustomersRes);
      const customersFromCollection = pickSettledCount(customersColRes);
      const customersCount = customersFromUsers || customersFromCollection;

      const labsCount = pickSettledCount(labsRes);

      const activeFromStatusActive = pickSettledCount(collectorsStatusActiveRes);
      const activeFromIsActive = pickSettledCount(collectorsIsActiveRes);
      const activeFromStatus = pickSettledCount(collectorsStatusRes);
      const collectorsCount =
        activeFromStatusActive || activeFromIsActive || activeFromStatus;

      const pendingCollectorsRows =
        pendingCollectorsRes.status === 'fulfilled'
          ? pendingCollectorsRes.value.docs.map((d) => {
              const data = d.data() || {};
              const name =
                data.name ||
                [data.firstName, data.lastName].filter(Boolean).join(' ') ||
                d.id;
              return { id: d.id, name };
            })
          : [];

      const pendingPrescriptionsRows =
        pendingPrescriptionsRes.status === 'fulfilled'
          ? pendingPrescriptionsRes.value.docs.map((d) => {
              const p = d.data() || {};
              const when = p.date?.toDate
                ? p.date.toDate()
                : p.createdAt?.toDate
                ? p.createdAt.toDate()
                : new Date(p.date || p.createdAt);
              return {
                id: d.id,
                name: p.customerName || p.name || 'Unknown',
                email: p.customerEmail || p.email || '',
                date:
                  when instanceof Date && !isNaN(when)
                    ? when.toISOString().slice(0, 10)
                    : '',
              };
            })
          : [];

      if (cancelled) return;

      setTotals((prev) => ({
        ...prev,
        activeCollectors: collectorsCount,
        labs: labsCount,
        customers: customersCount,
        revenue,
      }));
      setRevenueSeries(monthly);
      setPendingCollectors(pendingCollectorsRows);
      setPendingPrescriptions(pendingPrescriptionsRows);
    };

    run().catch((e) => console.error('Dashboard load error:', e));
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <main style={{ padding: 18, minWidth: 0 }}>
      {/* Top-right toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <RangePicker
          range={range}
          onChange={setRange}
          onSubmit={() => {
            // extra side-effects on range apply if needed
          }}
        />
      </div>

        <LayoutRow>
        <LeftCol>
        <StatsGrid>
      {stats.slice(0, 3).map((s) => (
        <StatCol key={s.label}>
        <StatCard label={s.label} value={s.value} icon={s.icon} />
        </StatCol>
      ))}

      {stats.slice(3).map((s) => (
        <StatColWithTopMargin key={s.label}>
          <StatCard label={s.label} value={s.value} icon={s.icon} />
        </StatColWithTopMargin>
      ))}
    </StatsGrid>
  </LeftCol>

  <RightCol>
    <PieWrapper>
      <PieCard
        title="Proportion Of Appointments: Tests Vs Packages"
        data={pie}
      />
    </PieWrapper>
  </RightCol>
</LayoutRow>

      <div className="grid" style={{ marginTop: 18 }}>
        <div className="cols-12">
          <BarChartCard
            title="Monthly Revenue Trend"
            data={revenueSeries}
            yPrefix="$"
          />
        </div>
      </div>

      {/* Pending rows */}
      <div className="grid" style={{ marginTop: 18 }}>
        <div className="cols-6">
          <div className="card">
            <h3 className="chart-title">Pending Collector Approval</h3>
            <div className="table-scroll" style={{ padding: 12 }}>
              <table
                className="table"
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
                aria-label="Pending Collector Approval"
              >
                <thead>
                  <tr style={{ background: 'var(--primary-600)', color: '#fff' }}>
                    <th
                      scope="col"
                      style={{ textAlign: 'left', padding: '12px 16px' }}
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: 'right', padding: '12px 16px' }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCollectors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '16px',
                        }}
                      >
                        No Data Available
                      </td>
                    </tr>
                  ) : (
                    pendingCollectors.map((row) => (
                      <tr
                        key={row.id}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '12px 16px' }}>{row.name}</td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                          }}
                        >
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="View"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              border: 'none',
                              background: '#f3f4f6',
                              color: 'var(--primary-700, #4338ca)',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
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

        <div className="cols-6">
          <div className="card">
            <h3 className="chart-title">Pending Review Prescriptions</h3>
            <div className="table-scroll" style={{ padding: 12 }}>
              <table
                className="table"
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
                aria-label="Pending Review Prescriptions"
              >
                <thead>
                  <tr style={{ background: 'var(--primary-600)', color: '#fff' }}>
                    <th
                      scope="col"
                      style={{ textAlign: 'left', padding: '12px 16px' }}
                    >
                      Customer Name
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: 'left', padding: '12px 16px' }}
                    >
                      Prescription Date
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: 'right', padding: '12px 16px' }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPrescriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '16px',
                        }}
                      >
                        No Data Available
                      </td>
                    </tr>
                  ) : (
                    pendingPrescriptions.map((row) => (
                      <tr
                        key={row.id}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <Avatar name={row.name} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{row.name}</div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--muted)',
                                }}
                              >
                                {row.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{row.date}</td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                          }}
                        >
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="View"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              border: 'none',
                              background: '#f3f4f6',
                              color: 'var(--primary-700, #4338ca)',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
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
