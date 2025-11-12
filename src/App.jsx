// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Appointments from "./pages/appointments/Appointments.jsx";
import AppointmentCreatePage from "./pages/appointments/AppointmentCreatePage.jsx";
import Collectors from "./pages/collectors/CollectorListPage.jsx";
import Labs from "./pages/labs/CollectorLab.jsx";
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
import CollectorLab from "./pages/labs/CollectorLab.jsx";
import CollectorLabForm from "./pages/labs/CollectorLabForm.jsx";
import CollectorLabSessionPage from "./pages/labs/CollectorLabSession.jsx";
import CollectorLabSessionForm from "./pages/labs/CollectorLabsessionForm.jsx";
import CollectorTestCaseList from "./pages/tescases/CollectorTestCaseList.jsx";
import CollectorTestCaseForm from "./pages/tescases/CollectorTestCaseForm.jsx";
import CollectorTestPackages from "./pages/tescases/CollectorTestPackages.jsx";
import CollectorPackagesForm from "./pages/tescases/CollectorPackagesForm.jsx";
import CollectorPrescription from "./pages/prescriptions/CollectorPrescription.jsx";
import CollectorPendingPrescription from "./pages/prescriptions/CollectorPendingPrescription.jsx";
import CollectorReviews from "./pages/reviews/CollectorReviews.jsx";
import PaymentList from "./pages/FinancialManagement/PaymentList.jsx";
import Payouts from "./pages/FinancialManagement/Payouts.jsx";
import CashPaymentList from "./pages/FinancialManagement/CashPaymentList.jsx";
import Coupans from "./pages/FinancialManagement/Coupans.jsx";
import TopBookTestCase from "./pages/report/TopBookTestCase.jsx";
import AppointmentViewPage from "./pages/appointments/AppointmentViewPage.jsx";

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

          <Route
            path="/appointments/view/:id"
            element={<AppointmentViewPage />}
          />
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
          <Route path="/collectors/bank" element={<CollectorBankPage />} />

          <Route path="/collectors/bank/form" element={<CollectorBankForm />} />

          <Route
            path="/collectors/document/form"
            element={<CollectorDocumentForm />}
          />

          <Route path="/topbook" element={<TopBookTestCase />} />

          <Route path="/labs" element={<CollectorLab />} />

          <Route path="/labs/form" element={<CollectorLabForm />} />
          <Route path="/labsession" element={<CollectorLabSessionPage />} />

          <Route
            path="/labsession/session"
            element={<CollectorLabSessionForm />}
          />

          <Route path="/testcases" element={<CollectorTestCaseList />} />

          <Route
            path="/testcases/testform"
            element={<CollectorTestCaseForm />}
          />

          <Route path="/testpackages" element={<CollectorTestPackages />} />

          <Route
            path="/testpackages/packageform"
            element={<CollectorPackagesForm />}
          />

          <Route path="/prescriptions" element={<CollectorPrescription />} />

          <Route
            path="/pendingpres"
            element={<CollectorPendingPrescription />}
          />
          <Route path="/paymentlist" element={<PaymentList />} />

          <Route path="/cashpaymentlist" element={<CashPaymentList />} />

          <Route path="/payouts" element={<Payouts />} />

          <Route path="/coupans" element={<Coupans />} />

          <Route path="/reviews" element={<CollectorReviews />} />

          <Route path="/collectors" element={<Collectors />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/test-cases" element={<TestCases />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
