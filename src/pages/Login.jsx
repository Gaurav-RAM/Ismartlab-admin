// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiCopy, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

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
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

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

  const fillDemo = (email, password) => {
    setForm(prev => ({ ...prev, email, password }));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <div className="logo" />
          <div className="brand-name">IsmartLabs</div>
        </div>

        <h2 className="title">Welcome back</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">Email <span className="req">*</span></label>
            <div className="input-wrap">
              <FiMail className="input-ico" aria-hidden />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={onChange}
                className="input"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password <span className="req">*</span></label>
            <div className="input-wrap">
              <FiLock className="input-ico" aria-hidden />
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                className="input"
                required
                autoComplete="current-password"
                aria-invalid={!!err}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <label className="check">
              <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
              Remember me
            </label>
            <Link to="#" className="link">Forgot Password?</Link>
          </div>

          {err && <div className="error">{err}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <hr className="divider" />
        <div className="demo-title">Demo accounts</div>

        <div className="demo-list">
          {demos.map((d) => (
            <div key={d.email} className="demo-row">
              <div className="demo-cred">
                <div className="demo-email">{d.email}</div>
                <div className="demo-pass">{d.password}</div>
              </div>
              <div className="demo-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => fillDemo(d.email, d.password)}
                  aria-label="Fill demo credentials"
                >
                  Use
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => copy(d.email, d.password)}
                  aria-label="Copy demo credentials"
                >
                  <FiCopy />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
