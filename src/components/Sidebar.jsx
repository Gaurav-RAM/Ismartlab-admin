// src/components/Sidebar.jsx
import { useState } from 'react';
import {
  FiChevronRight, FiChevronDown, FiGrid, FiCalendar, FiUsers, FiStar, FiDollarSign,
  FiFileText, FiBell, FiLifeBuoy, FiChevronLeft, FiList, FiClock, FiCircle, FiCreditCard,
  FiEdit2, FiTrendingUp
} from 'react-icons/fi';
import { FaFlask, FaListUl } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

const sections = [
  { heading: 'MAIN', items: [{ label: 'Dashboard', icon: <FiGrid />, path: '/dashboard' }] },
  { heading: 'APPOINTMENT MANAGEMENT', items: [{ label: 'Appointments', icon: <FiCalendar />, path: '/appointments' }] },
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
          { label: 'Collector Document List', icon: <FiFileText />, path: '/collectors/document' },
          { label: 'Collector Banks', icon: <FiCreditCard />, path: '/collectors/bank' },
        ],
      },
    ],
  },
  {
    heading: 'LABORATORY MANAGEMENT',
    items: [
      {
        label: 'Labs',
        icon: <FaFlask />,
        children: [
          { label: 'Labs', icon: <FiEdit2 />, path: '/labs' },
          { label: 'Lab Session', icon: <FiClock />, path: '/labsession', disabled: true },
        ],
      },
      {
        label: 'Test Case',
        icon: <FiFileText />,
        children: [
          { label: 'TestCaseList', icon: <FiEdit2 />, path: '/testcases' },
          { label: 'Packages', icon: <FiClock />, path: '/testpackages', disabled: true },
        ],
      },
      {
        label: 'Prescriptions',
        icon: <FiFileText />,
        children: [
          { label: 'All Prescriptions', icon: <FiEdit2 />, path: '/prescriptions' },
          { label: 'Pending Prescriptions', icon: <FiClock />, path: '/pendingpres', disabled: true },
        ],
      },
    ],
  },
  { heading: 'RATING & REVIEW', items: [{ label: 'Reviews', icon: <FiStar />, path: '/reviews' }] },
  {
    heading: 'FINANCIAL MANAGEMENT',
    items: [
      { label: 'Payment List', icon: <FiDollarSign />, path: '/paymentlist' },
      { label: 'Cash Payment List', icon: <FiDollarSign />, path: '/cashpaymentlist' },
      {
        label: 'Payouts',
        icon: <FiDollarSign />,
        children: [{ label: 'Collector Payout', icon: <FiCreditCard />, path: '/payouts' }],
      },
      {
        label: 'Earnings',
        icon: <FiDollarSign />,
        children: [{ label: 'Collector Earnings', icon: <FiDollarSign />, path: '/earnings' }],
      },
      { label: 'Coupons', icon: <FiFileText />, path: '/coupans' },
    ],
  },
  {
    heading: 'FINANCIAL MANAGEMENT',
    items: [
      {
        label: 'Reports',
        icon: <FiFileText />,
        children: [{ label: 'Top Booked Test Case', icon: <FiTrendingUp />, path: '/topbook' }],
      },
    ],
  },
  {
    heading: 'HELPDESK MANAGEMENT',
    items: [
      { label: 'Helpdesks', icon: <FiLifeBuoy />, path: '/helpdesks' },
      {
        label: 'Notification',
        icon: <FiBell />,
        children: [{ label: 'Notification List', icon: <FaListUl />, path: '/notifications' }],
      },
    ],
  },
];

export default function Sidebar({
  logoSrc = '/logo.svg',
  brandName = 'IsmartLabs',
  defaultOpen = ['MAIN', 'LABORATORY MANAGEMENT', 'FINANCIAL MANAGEMENT', 'USER MANAGEMENT'],
  defaultOpenSub = ['Collectors'],
  collapsed: controlledCollapsed,
  onToggle,
}) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const toggleSection = (h) => {
    const n = new Set(open);
    n.has(h) ? n.delete(h) : n.add(h);
    setOpen(n);
  };

  const [submenu, setSubmenu] = useState(() => new Set(defaultOpenSub));
  const toggleSubmenu = (label) => {
    const n = new Set(submenu);
    n.has(label) ? n.delete(label) : n.add(label);
    setSubmenu(n);
  };

  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : uncontrolledCollapsed;
  const handleToggle = () => (isControlled ? onToggle?.() : setUncontrolledCollapsed((c) => !c));
  const width = collapsed ? 72 : 260;

  const disabledHandlers = (disabled) =>
    disabled
      ? {
          'aria-disabled': true,
          tabIndex: -1,
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
          },
        }
      : {};

  return (
    <aside
      className="sb"
      style={{
        '--sb-hover-bg': 'var(--primary-50)',
        '--sb-hover-text': 'var(--text)',
        '--sb-active-bg': 'var(--primary-100)',
        '--sb-active-text': 'var(--text)',
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
      {/* CSS for hover/active states */}
      <style>{`
        .sb .sb-link,
        .sb .sb-child {
          transition: background-color .15s ease, color .15s ease, box-shadow .15s ease, opacity .15s ease;
        }
        .sb .ico {
          color: var(--primary-600);
          transition: color .15s ease;
        }
        .sb .sb-link:hover,
        .sb .sb-child:hover {
          background: var(--sb-hover-bg);
          color: var(--sb-hover-text);
        }
        .sb .sb-link:hover .ico,
        .sb .sb-child:hover .ico {
          color: var(--primary-700);
        }
        .sb .sb-link.is-active,
        .sb .sb-child.is-active,
        .sb .sb-link[aria-current],
        .sb .sb-child[aria-current] {
          background: var(--sb-active-bg);
          color: var(--sb-active-text);
          box-shadow: inset 3px 0 0 var(--primary-600);
        }
        .sb .sb-link.is-active .ico,
        .sb .sb-child.is-active .ico,
        .sb .sb-link[aria-current] .ico,
        .sb .sb-child[aria-current] .ico {
          color: var(--primary-700);
        }
      `}</style>

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
        <img src={logoSrc} alt="Brand" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
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
                        className="sb-link"
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
                        <span className="ico" style={{ fontSize: 18 }}>{it.icon}</span>
                        {!collapsed && <span>{it.label}</span>}
                        {!collapsed && (
                          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                            {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                          </span>
                        )}
                      </button>

                      {!collapsed && isOpen && (
                        <div id={contentId} role="group" aria-label={`${it.label} submenu`} style={{ marginLeft: 8 }}>
                          {it.children.map((child) => (
                            <NavLink
                              key={child.label}
                              to={child.path}
                              end
                              title={child.label}
                              className={({ isActive }) => `sb-child ${isActive ? 'is-active' : ''}`}
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
                                pointerEvents: child.disabled ? 'none' : 'auto',
                                opacity: child.disabled ? 0.5 : 1,
                              }}
                              {...disabledHandlers(child.disabled)}
                            >
                              <span className="ico" style={{ fontSize: 16 }}>{child.icon}</span>
                              <span>{child.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular leaf item
                return (
                  <NavLink
                    key={it.label}
                    to={it.path}
                    end
                    title={collapsed ? it.label : undefined}
                    className={({ isActive }) => `sb-link ${isActive ? 'is-active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      margin: '6px 0',
                      borderRadius: 10,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      background: 'transparent',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                  >
                    <span className="ico" style={{ fontSize: 18 }}>{it.icon}</span>
                    {!collapsed && <span>{it.label}</span>}
                    {!collapsed && (
                      <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                        <FiChevronRight />
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>
      ))}
    </aside>
  );
}
