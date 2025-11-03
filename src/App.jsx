// src/App.jsx (replace previous)
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Appointments from './pages/Appointments.jsx';
import Collectors from './pages/Collectors.jsx';
import Labs from './pages/Labs.jsx';
import TestCases from './pages/TestCases.jsx';
import Login from './pages/Login.jsx';
import RequireAuth from './routes/RequireAuth.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/collectors" element={<Collectors />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/test-cases" element={<TestCases />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
