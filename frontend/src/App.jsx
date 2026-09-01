import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { RepoView } from './pages/RepoView';
import { CommitLog } from './pages/CommitLog';
import { CommitView } from './pages/CommitView';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { StarredPage } from './pages/StarredPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppLayout } from './AppLayout';

import { RepoLayout } from './pages/repo/RepoLayout';
import { RepoIssues } from './pages/repo/RepoIssues';
import { RepoPulls } from './pages/repo/RepoPulls';
import { RepoActions } from './pages/repo/RepoActions';
import { RepoProjects } from './pages/repo/RepoProjects';
import { RepoSecurity } from './pages/repo/RepoSecurity';
import { RepoInsights } from './pages/repo/RepoInsights';
import { RepoSettings } from './pages/repo/RepoSettings';

import { MasterAuth } from './pages/admin/MasterAuth';
import { MasterLayout } from './pages/admin/MasterLayout';
import { MasterDashboard } from './pages/admin/MasterDashboard';

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem('vlt_token');
  return token ? children : <Navigate to="/auth" />;
}

function MasterRoute({ children }) {
  const token = sessionStorage.getItem('vlt_master_token');
  return token ? children : <Navigate to="/master" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* User Auth */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Master Auth */}
        <Route path="/master" element={<MasterAuth />} />
        
        {/* Master Protected Routes */}
        <Route element={<MasterRoute><MasterLayout /></MasterRoute>}>
          <Route path="/master/dashboard" element={<MasterDashboard />} />
          <Route path="/master/users" element={<MasterDashboard />} />
          <Route path="/master/repos" element={<MasterDashboard />} />
          <Route path="/master/logs" element={<MasterDashboard />} />
          <Route path="/master/settings" element={<MasterDashboard />} />
        </Route>

        {/* User Protected Routes */}
        <Route element={<AppLayout />}>
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/repositories" 
            element={
              <PrivateRoute>
                <RepositoriesPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/organizations" 
            element={
              <PrivateRoute>
                <OrganizationsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/starred" 
            element={
              <PrivateRoute>
                <StarredPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } 
          />
          
          <Route path="/:owner/:repo" element={<RepoLayout />}>
            <Route index element={<RepoView />} />
            <Route path="issues" element={<RepoIssues />} />
            <Route path="pulls" element={<RepoPulls />} />
            <Route path="actions" element={<RepoActions />} />
            <Route path="projects" element={<RepoProjects />} />
            <Route path="security" element={<RepoSecurity />} />
            <Route path="insights" element={<RepoInsights />} />
            <Route path="settings" element={<RepoSettings />} />
            <Route path="commits" element={<CommitLog />} />
            <Route path="commit/:hash" element={<CommitView />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
