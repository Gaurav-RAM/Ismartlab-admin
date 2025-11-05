// src/layouts/AdminLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="container"
      style={{
        display: 'grid',
        gridTemplateColumns: `${collapsed ? '72px' : '260px'} minmax(0, 1fr)`,
        minHeight: '100vh',
      }}
    >
      {/* Left: persistent sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

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
