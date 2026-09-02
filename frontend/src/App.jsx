import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { MasterAuth } from './pages/admin/MasterAuth';
import { MasterLayout } from './pages/admin/MasterLayout';
import { MasterDashboard } from './pages/admin/MasterDashboard';
import { AdminManagement } from './pages/admin/AdminManagement';
import { LandingPage } from './pages/LandingPage';

function MasterRoute({ children }) {
  const token = sessionStorage.getItem('vlt_master_token');
  return token ? children : <Navigate to="/master" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin Login */}
        <Route path="/master" element={<MasterAuth />} />
        
        {/* Admin Protected Routes */}
        <Route element={<MasterRoute><MasterLayout /></MasterRoute>}>
          <Route path="/master/dashboard" element={<MasterDashboard />} />
          <Route path="/master/admins" element={<AdminManagement />} />
          <Route path="/master/users" element={<MasterDashboard />} />
          <Route path="/master/repos" element={<MasterDashboard />} />
          <Route path="/master/logs" element={<MasterDashboard />} />
          <Route path="/master/settings" element={<MasterDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
