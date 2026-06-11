import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminHome from './pages/AdminHome';
import { BeneficiaryTable } from './pages/BeneficiaryTable';
import { BeneficiaryDetail } from './pages/BeneficiaryDetail';
import { DistrictRiskMap } from './pages/DistrictRiskMap';
import { LendingQueue } from './pages/LendingQueue';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { AuditViewer } from './pages/AuditViewer';
import { BeneficiaryPortal } from './pages/BeneficiaryPortal';
import Login from './pages/Login';
import useAuthStore from './store/authStore';

// Layout wrapper for authenticated navigation
const Layout = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
    <aside className="w-full md:w-64 bg-slate-900 text-slate-100 p-6 flex flex-col gap-4">
      <div className="font-bold text-xl text-white mb-8">SafeCred Platform</div>
      <a href="/dashboard" className="hover:text-[#2563EB] transition">Dashboard</a>
      <a href="/beneficiaries" className="hover:text-[#2563EB] transition">Beneficiaries</a>
      <a href="/lending" className="hover:text-[#2563EB] transition">Lending Queue</a>
      <a href="/analytics" className="hover:text-[#2563EB] transition">Analytics</a>
      <a href="/map" className="hover:text-[#2563EB] transition">Risk Map</a>
      <a href="/audit" className="hover:text-[#2563EB] transition">Audit Trail</a>
    </aside>
    <main className="flex-1 p-4 md:p-8 overflow-auto">
      <Outlet />
    </main>
  </div>
);

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminHome />} />
            <Route path="/beneficiaries" element={<BeneficiaryTable />} />
            <Route path="/beneficiary/:id" element={<BeneficiaryDetail />} />
            <Route path="/map" element={<DistrictRiskMap />} />
            <Route path="/lending" element={<LendingQueue />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/audit" element={<AuditViewer />} />
          </Route>
        </Route>

        {/* Beneficiary Portal Route */}
        <Route element={<ProtectedRoute allowedRoles={['BENEFICIARY']} />}>
          <Route path="/portal" element={<BeneficiaryPortal />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
