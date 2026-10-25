import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { RoleProvider, useRole } from './context/RoleContext';
import { PermissionsProvider } from './components/admin/PermissionGuard';

import { MasterAuth } from './pages/admin/MasterAuth';
import { MasterLayout } from './pages/admin/MasterLayout';

// 8 Dedicated Role Dashboards
import { SupportAgentDashboard } from './pages/admin/dashboards/SupportAgentDashboard';
import { HeadOfSupportDashboard } from './pages/admin/dashboards/HeadOfSupportDashboard';
import { AdminDashboard } from './pages/admin/dashboards/AdminDashboard';
import { FleetCoachDashboard } from './pages/admin/dashboards/FleetCoachDashboard';
import { HeadOfFleetCoachDashboard } from './pages/admin/dashboards/HeadOfFleetCoachDashboard';
import { ManagerDashboard } from './pages/admin/dashboards/ManagerDashboard';
import { FinanceAdminDashboard } from './pages/admin/dashboards/FinanceAdminDashboard';
import { FinancersDashboard } from './pages/admin/dashboards/FinancersDashboard';

// 6 Dedicated Viewing Pages
import { LiveRidesView } from './pages/admin/views/LiveRidesView';
import { DriversFleetView } from './pages/admin/views/DriversFleetView';
import { SupportTicketsView } from './pages/admin/views/SupportTicketsView';
import { FinancePayoutsView } from './pages/admin/views/FinancePayoutsView';
import { UsersDirectoryView } from './pages/admin/views/UsersDirectoryView';
import { AuditLogsView } from './pages/admin/views/AuditLogsView';

// RBAC & Management
import { AdminManagement } from './pages/admin/AdminManagement';
import { RolesList } from './pages/admin/rbac/RolesList';
import { CreateRole } from './pages/admin/rbac/CreateRole';

// Public Landing Pages
import { LandingPage } from './pages/LandingPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { CustomerAppPage } from './pages/CustomerAppPage';
import { SafetyPage } from './pages/SafetyPage';
import { SupportPage } from './pages/SupportPage';

function MasterRoute({ children }) {
  const token = sessionStorage.getItem('vlt_master_token');
  return token ? children : <Navigate to="/master" replace />;
}

// Dynamic redirect to the active role's dashboard
function DashboardRedirect() {
  const { currentRole } = useRole();
  return <Navigate to={currentRole?.defaultPath || '/master/dashboard/admin'} replace />;
}

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/customer" element={<CustomerAppPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* User Logins & Role Selection Portal */}
          <Route path="/master" element={<MasterAuth />} />
          <Route path="/login" element={<Navigate to="/master" replace />} />

          {/* Protected Master Staff Suite */}
          <Route
            element={
              <MasterRoute>
                <PermissionsProvider>
                  <MasterLayout />
                </PermissionsProvider>
              </MasterRoute>
            }
          >
            {/* Dashboard Redirector */}
            <Route path="/master/dashboard" element={<DashboardRedirect />} />

            {/* 8 Distinct Role Dashboards */}
            <Route path="/master/dashboard/support" element={<SupportAgentDashboard />} />
            <Route path="/master/dashboard/head-support" element={<HeadOfSupportDashboard />} />
            <Route path="/master/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/master/dashboard/fleet-coach" element={<FleetCoachDashboard />} />
            <Route path="/master/dashboard/head-fleet" element={<HeadOfFleetCoachDashboard />} />
            <Route path="/master/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="/master/dashboard/finance-admin" element={<FinanceAdminDashboard />} />
            <Route path="/master/dashboard/financer" element={<FinancersDashboard />} />

            {/* 6 Dedicated Viewing Pages */}
            <Route path="/master/rides" element={<LiveRidesView />} />
            <Route path="/master/drivers" element={<DriversFleetView />} />
            <Route path="/master/tickets" element={<SupportTicketsView />} />
            <Route path="/master/finance" element={<FinancePayoutsView />} />
            <Route path="/master/users" element={<UsersDirectoryView />} />
            <Route path="/master/logs" element={<AuditLogsView />} />

            {/* RBAC Staff & Role Management */}
            <Route path="/master/admins" element={<AdminManagement />} />
            <Route path="/master/access-control/roles" element={<RolesList />} />
            <Route path="/master/access-control/roles/create" element={<CreateRole />} />

            {/* Fallback */}
            <Route path="/master/*" element={<DashboardRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
