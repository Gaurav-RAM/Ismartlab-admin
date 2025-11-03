// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiCopy } from 'react-icons/fi';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // ✅ import Firebase auth

const demos = [
  { label: 'admin@gmail.com', email: 'admin@gmail.com', password: '12345678' },
  { label: 'vendor@gmail.com', email: 'vendor@gmail.com', password: '12345678' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      // ✅ Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // ✅ Save token if remember me
      if (form.remember) {
        localStorage.setItem("authToken", await user.getIdToken());
      } else {
        sessionStorage.setItem("authToken", await user.getIdToken());
      }

      navigate(from, { replace: true });
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (email, password) => {
    await navigator.clipboard.writeText(`${email}\n${password}`);
  };

  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'100vh', padding:'24px' }}>
      <div className="card" style={{ width:'min(560px, 92vw)'}}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="logo" />
            <div className="brand-name">IsmartLabs</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'grid', gap:14 }}>
          <label style={{ fontWeight:600 }}>Email <span style={{ color:'#ef4444' }}>*</span></label>
          <input
            name="email"
            type="email"
            placeholder="Enter Email"
            value={form.email}
            onChange={onChange}
            className="input"
            required
          />

          <label style={{ fontWeight:600 }}>Password <span style={{ color:'#ef4444' }}>*</span></label>
          <input
            name="password"
            type="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={onChange}
            className="input"
            required
          />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <label style={{ display:'flex', gap:8, alignItems:'center', color:'var(--muted)' }}>
              <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
              Remember Me
            </label>
            <Link to="#" style={{ color:'var(--primary)' }}>Forgot Password?</Link>
          </div>

          {err && <div style={{ color:'#ef4444', fontSize:14 }}>{err}</div>}

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </div>

          <div>
            <Link to="#" style={{ color:'var(--primary)' }}>Register as Vendor</Link>
          </div>
        </form>

        <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'16px 0' }} />
        <div style={{ textAlign:'center', fontWeight:700, marginBottom:8 }}>Demo Accounts</div>

        <div style={{ display:'grid', gap:12 }}>
          {demos.map((d) => (
            <div key={d.email} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0' }}>
              <div>
                <div style={{ fontWeight:600 }}>{d.email}</div>
                <div style={{ color:'var(--muted)', fontSize:14 }}>{d.password}</div>
              </div>
              <button
                aria-label="Copy demo credentials"
                onClick={() => copy(d.email, d.password)}
                className="btn"
                style={{ background:'transparent', color:'var(--text)', border:'1px solid var(--border)', padding:'8px 10px' }}
              >
                <FiCopy />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
