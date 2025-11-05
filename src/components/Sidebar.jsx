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
  FiList,
  FiClock,
  FiCircle,
  FiCreditCard,
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
    items: [
      {
        label: 'Collectors',
        icon: <FiUsers />,
        children: [
          { label: 'Collector List', icon: <FiList />, path: '/collectors' },
          { label: 'Pending Collector List', icon: <FiClock />, path: '/collectors/pending' },
          { label: 'Unassigned Collector List', icon: <FiCircle />, path: '/collectors/unassigned' },
          { label: 'Collector Document List', icon: <FiFileText />, path: '/collectors/documents' },
          { label: 'Collector Banks', icon: <FiCreditCard />, path: '/collectors/banks' },
        ],
      },
    ],
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
  defaultOpen = ['MAIN', 'LABORATORY MANAGEMENT', 'FINANCIAL MANAGEMENT', 'USER MANAGEMENT'],
  defaultOpenSub = ['Collectors'],

  // Controlled prop pattern: if `collapsed` is provided, component is controlled; otherwise it self-manages. 
  // NOTE: no default value here to allow detection of "controlled vs uncontrolled".
  collapsed: controlledCollapsed,
  onToggle, // optional; used only when controlled
}) {
  // Section open state
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const toggleSection = (h) => {
    const n = new Set(open);
    n.has(h) ? n.delete(h) : n.add(h);
    setOpen(n);
  };

  // Submenu open state
  const [submenu, setSubmenu] = useState(() => new Set(defaultOpenSub));
  const toggleSubmenu = (label) => {
    const n = new Set(submenu);
    n.has(label) ? n.delete(label) : n.add(label);
    setSubmenu(n);
  };

  // Uncontrolled collapsed state fallback
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : uncontrolledCollapsed;

  // Single toggle handler used by the button
  const handleToggle = () => {
    if (isControlled) {
      onToggle?.(); // let parent flip the prop
    } else {
      setUncontrolledCollapsed((c) => !c); // self-manage when uncontrolled
    }
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
        {!collapsed && <div style={{ fontWeight: 600 }}>{brandName}</div>}
        <button
          type="button"
          onClick={handleToggle}
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
              {sec.items.map((it) => {
                if (it.children && it.children.length) {
                  const contentId = `submenu-${it.label.replace(/\s+/g, '-').toLowerCase()}`;
                  const isOpen = submenu.has(it.label);
                  return (
                    <div key={it.label}>
                      <button
                        type="button"
                        title={collapsed ? it.label : undefined}
                        onClick={() => toggleSubmenu(it.label)}
                        aria-expanded={isOpen}
                        aria-controls={contentId}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          margin: '6px 0',
                          borderRadius: 10,
                          color: 'var(--text)',
                          background: 'transparent',
                          border: 'none',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: 'var(--primary-600)', fontSize: 18 }}>{it.icon}</span>
                        {!collapsed && <span>{it.label}</span>}
                        {!collapsed && (
                          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                            {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                          </span>
                        )}
                      </button>

                      {!collapsed && isOpen && (
                        <div
                          id={contentId}
                          role="group"
                          aria-label={`${it.label} submenu`}
                          style={{ marginLeft: 8 }}
                        >
                          {it.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.path}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px 8px 36px',
                                margin: '4px 0',
                                borderRadius: 8,
                                color: 'var(--text)',
                                textDecoration: 'none',
                                background: 'transparent',
                                fontSize: 14,
                              }}
                            >
                              <span style={{ color: 'var(--primary-600)', fontSize: 16 }}>
                                {child.icon}
                              </span>
                              <span>{child.label}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular leaf item
                return (
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
                );
              })}
            </nav>
          )}
        </div>
      ))}
    </aside>
  );
}
