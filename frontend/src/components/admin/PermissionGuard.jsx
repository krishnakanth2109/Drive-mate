import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PermissionsContext = createContext([]);

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = sessionStorage.getItem('vlt_master_token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const res = await axios.get('http://localhost:5000/api/rbac/my-permissions', {
          headers: { 'x-auth-token': token }
        });
        
        setPermissions(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, []);

  return (
    <PermissionsContext.Provider value={{ permissions, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

export const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { permissions, loading } = usePermissions();

  if (loading) return null; // or a tiny spinner

  // Determine if user has the specific permission or if they have manage (which implies they can do access control)
  // or a wildcard like "superadmin" if we supported that.
  if (permissions.includes(permission)) {
    return <>{children}</>;
  }
  
  return fallback;
};

export const hasPermission = (permissions, requiredPermission) => {
  return permissions.includes(requiredPermission);
};
