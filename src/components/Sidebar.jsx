// src/components/Sidebar.jsx
import { useState } from 'react';
import {
  FiChevronRight,
  FiChevronDown,
  FiGrid,
  FiCalendar,
  FiUsers,
  FiStar,
  FiDollarSign,
  FiFileText,
  FiBell,
  FiLifeBuoy,
  FiChevronLeft,
} from 'react-icons/fi';
import { FaFlask } from 'react-icons/fa';

const sections = [
  {
    heading: 'MAIN',
    items: [{ label: 'Dashboard', icon: <FiGrid />, path: '/dashboard' }],
  },
  {
    heading: 'APPOINTMENT MANAGEMENT',
    items: [{ label: 'Appointments', icon: <FiCalendar />, path: '/appointments' }],
  },
  {
    heading: 'USER MANAGEMENT',
    items: [{ label: 'Collectors', icon: <FiUsers />, path: '/collectors' }],
  },
  {
    heading: 'LABORATORY MANAGEMENT',
    items: [
      { label: 'Labs', icon: <FaFlask />, path: '/labs' },
      { label: 'Test Case', icon: <FiFileText />, path: '/test-cases' },
      { label: 'Prescriptions', icon: <FiFileText />, path: '/prescriptions' },
    ],
  },
  {
    heading: 'RATING & REVIEW',
    items: [{ label: 'Reviews', icon: <FiStar />, path: '/reviews' }],
  },
  {
    heading: 'FINANCIAL MANAGEMENT',
    items: [
      { label: 'Payment List', icon: <FiDollarSign />, path: '/payments' },
      { label: 'Cash Payment List', icon: <FiDollarSign />, path: '/cash-payments' },
      { label: 'Payouts', icon: <FiDollarSign />, path: '/payouts' },
      { label: 'Earnings', icon: <FiDollarSign />, path: '/earnings' },
      { label: 'Coupons', icon: <FiFileText />, path: '/coupons' },
    ],
  },
  {
    heading: 'FINANCIAL MANAGEMENT',
    items: [{ label: 'Reports', icon: <FiFileText />, path: '/reports' }],
  },
  {
    heading: 'HELPDESK MANAGEMENT',
    items: [
      { label: 'Helpdesks', icon: <FiLifeBuoy />, path: '/helpdesks' },
      { label: 'Notification', icon: <FiBell />, path: '/notifications' },
    ],
  },
];

export default function Sidebar({
  logoSrc = '/logo.svg',
  brandName = 'IsmartLabs',
  defaultOpen = ['MAIN', 'LABORATORY MANAGEMENT', 'FINANCIAL MANAGEMENT'],
  collapsed = false,
  onToggle = () => {},
}) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const toggleSection = (h) => {
    const n = new Set(open);
    n.has(h) ? n.delete(h) : n.add(h);
    setOpen(n);
  };

  const width = collapsed ? 72 : 260;

  return (
    <aside
      style={{
        width,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        padding: 12,
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        alignSelf: 'start',
        transition: 'width 160ms ease',
      }}
    >
      {/* Brand row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '6px 6px 10px 6px',
        }}
      >
        <img
          src={logoSrc}
          alt="Brand"
          style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }}
        />
        {!collapsed && <div style={{ fontWeight: 600 }}>KiviLabs</div>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            marginLeft: 'auto',
            width: 28,
            height: 28,
            borderRadius: '999px',
            border: 'none',
            background: 'var(--primary-600)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {/* Sections */}
      {sections.map((sec) => (
        <div key={sec.heading} style={{ marginBottom: 12 }}>
          {!collapsed && (
            <button
              onClick={() => toggleSection(sec.heading)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 11,
                letterSpacing: 0.4,
                margin: '6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              aria-expanded={open.has(sec.heading)}
            >
              <span>{sec.heading}</span>
              {open.has(sec.heading) ? <FiChevronDown /> : <FiChevronRight />}
            </button>
          )}

          {(collapsed || open.has(sec.heading)) && (
            <nav>
              {sec.items.map((it) => (
                <a
                  key={it.label}
                  href={it.path}
                  title={collapsed ? it.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    margin: '6px 0',
                    borderRadius: 10,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    background: it.label === 'Dashboard' ? 'var(--primary-50)' : 'transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  <span style={{ color: 'var(--primary-600)', fontSize: 18 }}>{it.icon}</span>
                  {!collapsed && <span>{it.label}</span>}
                  {!collapsed && (
                    <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                      <FiChevronRight />
                    </span>
                  )}
                </a>
              ))}
            </nav>
          )}
        </div>
      ))}
    </aside>
  );
}
