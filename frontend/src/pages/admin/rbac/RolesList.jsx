import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Lock, 
  FileCheck, 
  Check, 
  X, 
  Save, 
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PermissionGuard, usePermissions } from '../../../components/admin/PermissionGuard';

const PERMISSION_TAXONOMY = [
  {
    category: 'Driver Document Verification & Compliance',
    icon: FileCheck,
    permissions: [
      { id: 'documents:read', label: 'View Driver Documents (DL, Aadhaar, PAN, RC, Insurance)' },
      { id: 'documents:verify', label: 'Verify Documents (Sandbox API & Manual)' },
      { id: 'documents:reject', label: 'Reject Documents & Request Re-upload' },
      { id: 'documents:download', label: 'Download & Export Document Vault' },
      { id: 'verification:manage', label: 'Full Driver Onboarding Management' }
    ]
  },
  {
    category: 'Roles & Access Control (RBAC)',
    icon: Lock,
    permissions: [
      { id: 'role:read', label: 'View System Roles' },
      { id: 'role:create', label: 'Create Custom Roles' },
      { id: 'role:update', label: 'Modify Roles & Permissions' },
      { id: 'role:delete', label: 'Delete Roles' },
      { id: 'staff:read', label: 'View Staff Directory' },
      { id: 'staff:manage', label: 'Assign Roles to Staff' },
      { id: 'audit:read', label: 'View Security Audit Trail' }
    ]
  },
  {
    category: 'Drivers & Fleet',
    icon: Users,
    permissions: [
      { id: 'driver:read', label: 'View Drivers' },
      { id: 'driver:create', label: 'Create Driver Records' },
      { id: 'driver:update', label: 'Update Driver Profiles' },
      { id: 'driver:suspend', label: 'Suspend Drivers' },
      { id: 'driver:approve', label: 'Approve & Activate Drivers' }
    ]
  },
  {
    category: 'Rides & Dispatch',
    icon: ShieldCheck,
    permissions: [
      { id: 'ride:read', label: 'View Rides & Live GPS' },
      { id: 'ride:create', label: 'Create Rides' },
      { id: 'ride:update', label: 'Update Rides' },
      { id: 'ride:cancel', label: 'Cancel Rides' },
      { id: 'ride:assign', label: 'Assign Drivers' },
      { id: 'ride:investigate', label: 'Investigate Rides' }
    ]
  },
  {
    category: 'Finance & Payments',
    icon: Sparkles,
    permissions: [
      { id: 'payment:read', label: 'View Payment Ledgers' },
      { id: 'payment:refund', label: 'Issue Customer Refunds' },
      { id: 'finance:manage', label: 'Authorize Driver Payouts' }
    ]
  }
];

export function RolesList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalPermissions, setModalPermissions] = useState([]);
  const [modalName, setModalName] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalStatus, setModalStatus] = useState('Active');
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchRoles = async () => {
    try {
      const token = sessionStorage.getItem('vlt_master_token');
      const res = await axios.get(`${API_URL}/rbac/roles`, {
        headers: { 'x-auth-token': token }
      });
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openEditModal = (role) => {
    setEditingRole(role);
    setModalName(role.name || '');
    setModalDesc(role.description || '');
    setModalStatus(role.status || 'Active');
    setModalPermissions(role.permissions || []);
  };

  const closeEditModal = () => {
    setEditingRole(null);
  };

  const togglePermission = (permId) => {
    setModalPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const selectAllPermissions = () => {
    const allIds = PERMISSION_TAXONOMY.flatMap((g) => g.permissions.map((p) => p.id));
    setModalPermissions(Array.from(new Set([...allIds, '*', 'all'])));
  };

  const clearAllPermissions = () => {
    setModalPermissions([]);
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const token = sessionStorage.getItem('vlt_master_token');
      const roleId = editingRole._id || editingRole.id;
      await axios.put(
        `${API_URL}/rbac/roles/${roleId}`,
        {
          name: modalName,
          description: modalDesc,
          status: modalStatus,
          permissions: modalPermissions,
        },
        {
          headers: { 'x-auth-token': token },
        }
      );
      closeEditModal();
      fetchRoles();
      alert('Role and permissions updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, isSystem, userCount) => {
    if (isSystem) return alert('System roles cannot be deleted.');
    if (userCount > 0) return alert(`Reassign ${userCount} users before deleting this role.`);

    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const token = sessionStorage.getItem('vlt_master_token');
        await axios.delete(`${API_URL}/rbac/roles/${id}`, {
          headers: { 'x-auth-token': token },
        });
        fetchRoles();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting role');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Admin Access Control
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-emerald-400" />
            Roles & Permissions Management
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Modify roles, toggle granular permissions, and inspect driver document verification rights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/master/verification/dl')}
            className="flex items-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <FileCheck className="w-4 h-4 mr-2 text-blue-400" />
            View Driver Documents
          </button>
          <button
            onClick={() => navigate('/master/access-control/roles/create')}
            className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Role
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading roles and permissions matrix...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="px-6 py-4">Role & Code</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Users</th>
                <th className="px-6 py-4">Permissions Active</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {roles.map((role) => {
                const roleId = role._id || role.id;
                const hasFullAccess = role.permissions?.includes('*') || role.permissions?.includes('all');

                return (
                  <tr key={roleId} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-bold text-white text-sm">{role.name}</span>
                        {role.isSystem && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold rounded border border-blue-500/20">
                            System
                          </span>
                        )}
                        {role.code === 'ADMIN' && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold rounded border border-emerald-500/20">
                            Super Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">{role.code}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400 max-w-xs">{role.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-neutral-300">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                        {role.userCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {hasFullAccess ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          ALL PERMISSIONS (*)
                        </span>
                      ) : (
                        <span className="text-neutral-300 font-semibold">
                          {role.permissions?.length || 0} rules
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          role.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-400'
                        }`}
                      >
                        {role.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(role)}
                        title="Modify Role & Permissions"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-400 text-xs font-medium rounded-lg border border-neutral-700 hover:border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>

                      {!role.isSystem && (
                        <button
                          onClick={() => handleDelete(roleId, role.isSystem, role.userCount)}
                          title="Delete Role"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT ROLE & PERMISSIONS MODAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Modify Role: {editingRole.name}
                    <span className="text-xs font-mono text-neutral-400">({editingRole.code})</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Adjust permissions, document verification rights, and operational scope
                  </p>
                </div>
              </div>

              <button
                onClick={closeEditModal}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Role Display Name
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Role Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Permissions Control Bar */}
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Permissions Configuration</span>
                      <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                        {modalPermissions.length} Active
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-400">Select capabilities granted to accounts under this role</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-lg border border-neutral-700 font-medium"
                    >
                      Grant All (*)
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg border border-neutral-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Grid */}
                <div className="space-y-4">
                  {PERMISSION_TAXONOMY.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.category} className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80">
                        <div className="flex items-center gap-2 mb-3">
                          <GroupIcon className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                            {group.category}
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.permissions.map((perm) => {
                            const isChecked =
                              modalPermissions.includes(perm.id) ||
                              modalPermissions.includes('*') ||
                              modalPermissions.includes('all');

                            return (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-start text-left p-2.5 rounded-xl border text-xs transition-all ${
                                  isChecked
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded mt-0.5 mr-2.5 flex items-center justify-center border ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-500 text-neutral-950'
                                      : 'border-neutral-700 bg-neutral-950'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white leading-tight">{perm.label}</div>
                                  <div className="text-[10px] font-mono text-neutral-500 mt-0.5">{perm.id}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-800 flex items-center justify-between bg-neutral-950">
              <span className="text-xs text-neutral-500">
                Changes apply immediately to all active staff under this role.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="flex items-center px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save Role & Permissions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
