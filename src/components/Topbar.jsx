// src/components/Topbar.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMoon, FiSun, FiUser, FiInfo, FiRotateCcw, FiDollarSign, FiLogOut } from 'react-icons/fi';

// Your app state (if any) and Firebase instances
import { useUI } from '../state/UIContext.jsx';
import { auth, db } from '../firebase.js';

// Firebase SDK APIs
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme, smaller, larger } = useUI();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Track last created blob URL so we can revoke it
  const lastBlobUrlRef = useRef('');

  const initials = useMemo(() => {
    const base = (displayName || email || '').trim();
    if (!base) return 'U';
    const parts = base.split(/\s+/);
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] || '') + (parts[1][0] || '');
    return letters.toUpperCase();
  }, [displayName, email]);

  // Helper: set avatar from Firestore Bytes by creating a blob URL
  const setAvatarFromBytes = (bytesValue, mime) => {
    try {
      const u8 = bytesValue.toUint8Array();
      const blob = new Blob([u8], { type: mime || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = url;
      setAvatarUrl(url);
    } catch {
      // If anything fails, clear and fall back
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = '';
      }
      setAvatarUrl(null);
    }
  };

  // Auth + Firestore real-time listeners
  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setDisplayName(u?.displayName || '');
      setEmail(u?.email || '');
      // Start with Auth photoURL while we wait for Firestore
      setAvatarUrl(u?.photoURL || null);

      // Cleanup prior Firestore listener
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (u) {
        const ref = doc(db, 'users', u.uid);
        unsubDoc = onSnapshot(ref, (snap) => {
          if (!snap.exists()) {
            // No profile doc; keep whatever we had (e.g., Auth photoURL)
            return;
          }
          const data = snap.data() || {};

          // 1) Prefer Bytes avatar saved by Profile page
          if (data.avatarBytes) {
            setAvatarFromBytes(data.avatarBytes, data.avatarMime);
            return;
          }

          // 2) Else prefer explicit http(s) URL fields in Firestore
          const urlCandidates = [data.photoURL, data.avatarUrl, data.avatar, data.photo];
          const httpUrl = urlCandidates.find((c) => typeof c === 'string' && /^https?:\/\//i.test(c));

          // Clear any previous blob URL if switching away from bytes
          if (lastBlobUrlRef.current) {
            URL.revokeObjectURL(lastBlobUrlRef.current);
            lastBlobUrlRef.current = '';
          }

          setAvatarUrl(httpUrl || u.photoURL || null);
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = '';
      }
    };
  }, []);

  // Close on click outside + Esc (use 'click' so menu item onClick runs first)
  useEffect(() => {
    const onDocClick = (e) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  async function handleLogout() {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {}); } catch {}
    try { localStorage.removeItem('authToken'); localStorage.removeItem('user'); } catch {}
    try { sessionStorage.clear(); } catch {}
    try {
      document.cookie.split(';').forEach((c) => {
        const eq = c.indexOf('=');
        const name = (eq > -1 ? c.slice(0, eq) : c).trim();
        if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch {}
    setOpen(false);
    window.location.assign('/login');
  }

  return (
    <header style={{ justifyContent: 'flex-end' }} className="topbar">
      <div className="top-actions">
        <span>A</span>
        <button
          type="button"
          className="btn"
          style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
          onClick={smaller}
        >
          A
        </button>
        <button
          type="button"
          className="btn"
          style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
          onClick={larger}
        >
          A
        </button>
        <button
          type="button"
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
        <div className="profile" style={{ position: 'relative' }} ref={containerRef}>
          <button
            type="button"
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                onError={() => {
                  // If URL fails (unlikely for a blob), clear and fall back
                  if (lastBlobUrlRef.current) {
                    URL.revokeObjectURL(lastBlobUrlRef.current);
                    lastBlobUrlRef.current = '';
                  }
                  setAvatarUrl(null);
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: 'var(--muted)', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                    onError={() => {
                      if (lastBlobUrlRef.current) {
                        URL.revokeObjectURL(lastBlobUrlRef.current);
                        lastBlobUrlRef.current = '';
                      }
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: 'var(--muted)', color: 'var(--text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName || 'User'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground, #888)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {email || '—'}
                  </div>
                </div>
              </div>

              {/* Menu list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
                <MenuItem icon={<FiUser />} label="My Profile" onClick={() => { setOpen(false); navigate('/profile'); }} />
                <MenuItem icon={<FiInfo />} label="My Info" onClick={() => setOpen(false)} />
                <MenuItem icon={<FiRotateCcw />} label="Subscription History" onClick={() => setOpen(false)} />
                <MenuItem icon={<FiDollarSign />} label="Wallet" end={<span style={{ color: 'var(--primary, #2563eb)', fontWeight: 600 }}>$0.00</span>} onClick={() => setOpen(false)} />
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
        type="button"
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
