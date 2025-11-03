// src/layouts/AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function AdminLayout() {
  return (
    <div
      className="container"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr)',
        minHeight: '100vh',
      }}
    >
      {/* Left: persistent sidebar */}
      <Sidebar />

      {/* Right: topbar + routed content */}
      <div className="content" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main className="main" style={{ padding: 18 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
