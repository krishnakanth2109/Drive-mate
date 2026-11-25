import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { RoleProvider } from './context/RoleContext';
import { PermissionsProvider } from './components/admin/PermissionGuard';

import { AdminLogin } from './pages/admin/AdminLogin';
import { MasterLayout } from './pages/admin/MasterLayout';

// Core 5 Streamlined TSX Views
import { MasterAdminDashboard } from './pages/admin/dashboard/MasterAdminDashboard';
import { OrdersManagementView } from './pages/admin/orders/OrdersManagementView';
import { RidersVerificationView } from './pages/admin/riders/RidersVerificationView';
import { UsersManager } from './pages/admin/users/UsersManager';
import { RolesPermissionsManager } from './pages/admin/rbac/RolesPermissionsManager';

// Public Landing Pages
import { LandingPage } from './pages/LandingPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { CustomerAppPage } from './pages/CustomerAppPage';
import { SafetyPage } from './pages/SafetyPage';
import { SupportPage } from './pages/SupportPage';

// User & Commuter Community Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';

function MasterRoute({ children }) {
  const token = sessionStorage.getItem('vlt_master_token');
  return token ? children : <Navigate to="/master" replace />;
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

          {/* User Commuter Community & 7-Step Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/wallet" element={<Navigate to="/dashboard?tab=wallet" replace />} />
          <Route path="/community" element={<Navigate to="/dashboard" replace />} />

          {/* Staff Master Suite Portal & Real Backend Login */}
          <Route path="/master" element={<AdminLogin />} />
          <Route path="/master/login" element={<AdminLogin />} />

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
            {/* Core 5 Unified Sections */}
            <Route path="/master/dashboard" element={<MasterAdminDashboard />} />
            <Route path="/master/orders" element={<OrdersManagementView />} />
            <Route path="/master/riders" element={<RidersVerificationView />} />
            <Route path="/master/users" element={<UsersManager />} />
            <Route path="/master/roles" element={<RolesPermissionsManager />} />

            {/* Seamless Aliases & Redirects */}
            <Route path="/master/rides" element={<Navigate to="/master/orders" replace />} />
            <Route path="/master/drivers" element={<Navigate to="/master/riders" replace />} />
            <Route path="/master/admins" element={<Navigate to="/master/users" replace />} />
            <Route path="/master/access-control/roles" element={<Navigate to="/master/roles" replace />} />
            <Route path="/master/verification" element={<Navigate to="/master/riders" replace />} />
            <Route path="/master/verification/*" element={<Navigate to="/master/riders" replace />} />
            <Route path="/master/dashboard/*" element={<Navigate to="/master/dashboard" replace />} />

            {/* Fallback */}
            <Route path="/master/*" element={<Navigate to="/master/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
