import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/shared/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import BeneficiaryDirectory from './pages/beneficiaries/BeneficiaryDirectory';
import BeneficiaryProfilePage from './pages/beneficiaries/BeneficiaryProfilePage';
import ScoreExplorerPage from './pages/explorer/ScoreExplorerPage';
import RiskHeatMapPage from './pages/map/RiskHeatMapPage';
import LendingQueuePage from './pages/lending/LendingQueuePage';
import LoanApplicationDetailPage from './pages/lending/LoanApplicationDetailPage';
import AnalyticsHubPage from './pages/analytics/AnalyticsHubPage';
import DataUploadPage from './pages/ingestion/DataUploadPage';
import AuditTrailPage from './pages/audit/AuditTrailPage';
import SystemAdminPage from './pages/admin/SystemAdminPage';

// Portal
import PortalLayout from './layouts/PortalLayout';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalScorePage from './pages/portal/PortalScorePage';
import PortalApplyLoanPage from './pages/portal/PortalApplyLoanPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes inside AdminLayout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="beneficiaries" element={<BeneficiaryDirectory />} />
            <Route path="beneficiaries/:id" element={<BeneficiaryProfilePage />} />
            <Route path="score-explorer" element={<ScoreExplorerPage />} />
            <Route path="map" element={<RiskHeatMapPage />} />
            <Route path="lending" element={<LendingQueuePage />} />
            <Route path="lending/:appId" element={<LoanApplicationDetailPage />} />
            <Route path="analytics" element={<AnalyticsHubPage />} />
            <Route path="data-upload" element={<DataUploadPage />} />
            <Route path="audit" element={<AuditTrailPage />} />
            <Route path="admin" element={<SystemAdminPage />} />
          </Route>
        </Route>

        {/* Mobile Beneficiary Portal Routes */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Navigate to="/portal/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<PortalDashboardPage />} />
            <Route path="my-score" element={<PortalScorePage />} />
            <Route path="apply-loan" element={<PortalApplyLoanPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
