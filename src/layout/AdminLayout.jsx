// src/layouts/AdminLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import Footer from '../components/Footer.jsx';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="container"
      style={{
        display: 'grid',
        gridTemplateColumns: `${collapsed ? '72px' : '260px'} minmax(0, 1fr)`,
        minHeight: '100vh',
        background: 'var(--bg)',           // themed background
        color: 'var(--text)',              // themed text color
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      <div
        className="content"
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          minHeight: '100vh',
          background: 'var(--bg)',         // ensure the right pane is themed
          color: 'var(--text)',
        }}
      >
        <Topbar />

        <main
          className="main"
          style={{
            padding: 18,
            overflow: 'auto',
            background: 'var(--bg)',       // theme main scroll area
            color: 'var(--text)',
          }}
          role="main"
        >
          <Outlet />
        </main>

        <Footer
          text="Ismartlab: Your Ultimate Entertainment Hub"
          version="v1.2.1"
        />
      </div>
    </div>
  );
}
