import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { MasterAuth } from './pages/admin/MasterAuth';
import { MasterLayout } from './pages/admin/MasterLayout';
import { MasterDashboard } from './pages/admin/MasterDashboard';
import { AdminManagement } from './pages/admin/AdminManagement';
import { RolesList } from './pages/admin/rbac/RolesList';
import { CreateRole } from './pages/admin/rbac/CreateRole';
import { PermissionsProvider } from './components/admin/PermissionGuard';
import { LandingPage } from './pages/LandingPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { CustomerAppPage } from './pages/CustomerAppPage';
import { SafetyPage } from './pages/SafetyPage';
import { SupportPage } from './pages/SupportPage';

function MasterRoute({ children }) {
  const token = sessionStorage.getItem('vlt_master_token');
  return token ? children : <Navigate to="/master" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/customer" element={<CustomerAppPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/support" element={<SupportPage />} />
        
        {/* Admin Login */}
        <Route path="/master" element={<MasterAuth />} />
        
        {/* Admin Protected Routes */}
        <Route element={<MasterRoute><PermissionsProvider><MasterLayout /></PermissionsProvider></MasterRoute>}>
          <Route path="/master/dashboard" element={<MasterDashboard />} />
          <Route path="/master/admins" element={<AdminManagement />} />
          <Route path="/master/users" element={<MasterDashboard />} />
          <Route path="/master/repos" element={<MasterDashboard />} />
          <Route path="/master/logs" element={<MasterDashboard />} />
          <Route path="/master/settings" element={<MasterDashboard />} />
          <Route path="/master/access-control/roles" element={<RolesList />} />
          <Route path="/master/access-control/roles/create" element={<CreateRole />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
