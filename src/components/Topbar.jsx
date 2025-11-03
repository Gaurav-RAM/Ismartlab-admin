import { useUI } from '../state/UIContext.jsx';
import { FiBell, FiMoon, FiSun } from 'react-icons/fi';

export default function Topbar() {
  const { theme, toggleTheme, smaller, larger } = useUI();
  return (
    <header className="topbar">
      <div className="search">
        <input type="date" />
        <button className="btn">Submit</button>
      </div>
      <div className="top-actions">
        <span>A</span>
        <button className="btn" style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={smaller}>A</button>
        <button className="btn" style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={larger}>A</button>
        <button className="btn" style={{ padding: 8, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={toggleTheme}>
          {theme === 'light' ? <FiSun /> : <FiMoon />}
        </button>
        <FiBell size={20} />
        <span className="badge">EN</span>
        <div className="avatar" />
      </div>
    </header>
  );
}
