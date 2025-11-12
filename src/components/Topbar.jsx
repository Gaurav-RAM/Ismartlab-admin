import { useEffect, useRef, useState } from 'react';
import { useUI } from '../state/UIContext.jsx';
import {
  FiBell,
  FiMoon,
  FiSun,
  FiUser,
  FiInfo,
  FiRotateCcw,
  FiDollarSign,
  FiLogOut,
} from 'react-icons/fi';

export default function Topbar() {
  const { theme, toggleTheme, smaller, larger } = useUI();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside + Esc
  useEffect(() => {
    const onDocClick = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const user = {
    name: 'Liam Long',
    email: 'vendor@gmail.com',
    avatar: 'https://i.pravatar.cc/80?img=12', // swap with your avatar url
  };

  // Logout handler
  async function handleLogout() {
    try {
      // If your backend manages httpOnly cookies, this will clear them server-side
      await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch (_) {}

    // Clear client-side storage
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch (_) {}
    try {
      sessionStorage.clear();
    } catch (_) {}

    // Expire all accessible cookies (won’t affect httpOnly cookies set on another subdomain)
    try {
      document.cookie.split(';').forEach((c) => {
        const eq = c.indexOf('=');
        const name = (eq > -1 ? c.slice(0, eq) : c).trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch (_) {}

    setOpen(false);
    // Redirect to login (change if your route differs)
    window.location.assign('/login');
  }

  return (
    <header style={{justifyContent:"flex-end"}} className="topbar">

      <div className="top-actions">
        <span>A</span>
        <button
          className="btn"
          style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
          onClick={smaller}
        >
          A
        </button>
        <button
          className="btn"
          style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
          onClick={larger}
        >
          A
        </button>
        <button
          className="btn"
          style={{ padding: 8, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <FiSun /> : <FiMoon />}
        </button>
        <FiBell size={20} />
        <span className="badge">EN</span>

        {/* Profile dropdown */}
        <div className="profile" style={{ position: 'relative' }}>
          <button
            className="profile-btn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Open profile menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 2,
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <div
              className="avatar"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--muted)',
                backgroundImage: `url(${user.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </button>

          {open && (
            <div
              ref={menuRef}
              role="menu"
              className="profile-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 320,
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--bg)',
                boxShadow: '0 12px 28px rgba(0,0,0,.12)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  background: 'var(--panel, rgba(0,0,0,0.03))',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundImage: `url(${user.avatar})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted-foreground, #888)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Menu list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
                <MenuItem icon={<FiUser />} label="My Profile" onClick={() => setOpen(false)} />
                <MenuItem icon={<FiInfo />} label="My Info" onClick={() => setOpen(false)} />
                <MenuItem icon={<FiRotateCcw />} label="Subscription History" onClick={() => setOpen(false)} />
                <MenuItem
                  icon={<FiDollarSign />}
                  label="Wallet"
                  end={<span style={{ color: 'var(--primary, #2563eb)', fontWeight: 600 }}>$0.00</span>}
                  onClick={() => setOpen(false)}
                />
                <div style={{ height: 8 }} />
                <MenuItem icon={<FiLogOut />} label="Logout" onClick={handleLogout} />
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, label, end, onClick }) {
  return (
    <li>
      <button
        role="menuitem"
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover, rgba(0,0,0,0.05))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--muted-foreground, #777)' }}>{icon}</span>
          <span>{label}</span>
        </span>
        {end}
      </button>
    </li>
  );
}
