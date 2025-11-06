// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Appointments from "./pages/Appointments.jsx";
import AppointmentCreatePage from "./pages/AppointmentCreatePage.jsx";
import Collectors from "./pages/collectors/CollectorListPage.jsx";
import Labs from "./pages/Labs.jsx";
import TestCases from "./pages/TestCases.jsx";
import Login from "./pages/Login.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import CreateCollectorForm from "./pages/collectors/CollectorForm.jsx";
import CollectorListPage from "./pages/collectors/CollectorListPage.jsx";
import CollectorUnassignedList from "./pages/collectors/CollectorUnassignedList.jsx";
import CollectorDocumentList from "./pages/collectors/CollectorDocumentList.jsx";
import CollectorPendingList from "./pages/collectors/CollectorPendingList.jsx";
import CollectorBankPage from "./pages/collectors/CollectorBankPage.jsx";
import CollectorDocumentForm from "./pages/collectors/CollectorDocumentForm.jsx";
import CollectorBankForm from "./pages/collectors/CollectorBankForm.jsx";



export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<AppointmentCreatePage />} />
          <Route path="/collectors/new" element={<CreateCollectorForm />} />
          <Route path="/collectors/list" element={<CollectorListPage />} />
          <Route
            path="/collectors/unassigned"
            element={<CollectorUnassignedList />}
          />
              <Route
            path="/collectors/pending"
            element={<CollectorPendingList />}
          />
          <Route
            path="/collectors/document"
            element={<CollectorDocumentList />}
          />
          <Route
            path="/collectors/bank"
            element={<CollectorBankPage />}
          />

           <Route
            path="/collectors/bank/form"
            element={<CollectorBankForm />}
          />

           <Route
            path="/collectors/document/form"
            element={<CollectorDocumentForm />}
          />

          <Route path="/collectors" element={<Collectors />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/test-cases" element={<TestCases />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
