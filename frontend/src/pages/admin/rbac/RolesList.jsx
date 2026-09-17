import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ShieldCheck, Users } from 'lucide-react';
import { PermissionGuard, hasPermission, usePermissions } from '../../../components/admin/PermissionGuard';

export function RolesList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = sessionStorage.getItem('vlt_master_token');
      const res = await axios.get('http://localhost:5000/api/rbac/roles', {
        headers: { 'x-auth-token': token }
      });
      setRoles(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isSystem, userCount) => {
    if (isSystem) return alert('System roles cannot be deleted.');
    if (userCount > 0) return alert(`Reassign ${userCount} users before deleting this role.`);
    
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const token = sessionStorage.getItem('vlt_master_token');
        await axios.delete(`http://localhost:5000/api/rbac/roles/${id}`, {
          headers: { 'x-auth-token': token }
        });
        fetchRoles();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting role');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-emerald-400" />
            Roles Management
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Manage system roles and permissions</p>
        </div>
        <PermissionGuard permission="role:create">
          <button 
            onClick={() => navigate('/master/access-control/roles/create')}
            className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading roles...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-800">
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300">Description</th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300">Users</th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300">Permissions</th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {roles.map(role => (
                <tr key={role._id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="font-medium text-white">{role.name}</span>
                      {role.isSystem && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold rounded">System</span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">{role.code}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{role.description}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-neutral-300">
                      <Users className="w-4 h-4 mr-2 text-neutral-500" />
                      {role.userCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {role.permissions.length}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      role.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      {role.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {hasPermission(permissions, 'role:update') && (
                       <button 
                         onClick={() => navigate(`/master/access-control/roles/edit/${role._id}`)}
                         className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                    )}
                    {hasPermission(permissions, 'role:delete') && (
                       <button 
                         onClick={() => handleDelete(role._id, role.isSystem, role.userCount)}
                         disabled={role.isSystem}
                         className={`p-2 rounded-lg transition-colors ${
                           role.isSystem 
                             ? 'text-neutral-600 cursor-not-allowed' 
                             : 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10'
                         }`}
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
