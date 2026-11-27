import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Users, 
  Sparkles, 
  Lock,
  Layers
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { adminApi } from '../../../api/adminApi';
import { useRole } from '../../../context/RoleContext';

export function RolesPermissionsManager() {
  const { refreshPermissions } = useRole();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Role Form State
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleScope, setRoleScope] = useState('All Resources');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // New Permission Form State
  const [permCode, setPermCode] = useState('');
  const [permName, setPermName] = useState('');
  const [permCategory, setPermCategory] = useState('Operations');
  const [permDesc, setPermDesc] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permsData] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissionsCatalog(),
      ]);

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permsData) ? permsData : []);
    } catch (err: any) {
      console.error('Failed to load RBAC data:', err);
      setError(err?.message || 'Failed to load RBAC configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createRole({
        name: roleName.trim(),
        code: roleCode.trim().toUpperCase(),
        description: roleDescription,
        accessScope: roleScope,
        permissions: selectedPermissions,
      });

      alert('Role created successfully!');
      setIsCreateRoleOpen(false);
      setRoleName('');
      setRoleCode('');
      setRoleDescription('');
      setSelectedPermissions([]);
      loadData();
    } catch (err: any) {
      alert(`Role creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await fetchApi('/rbac/permissions', {
        method: 'POST',
        body: JSON.stringify({
          code: permCode.trim().toLowerCase(),
          name: permName.trim(),
          category: permCategory,
          description: permDesc,
        }),
      });

      alert('Permission created and registered successfully!');
      setIsCreatePermissionOpen(false);
      setPermCode('');
      setPermName('');
      setPermDesc('');
      loadData();
      refreshPermissions();
    } catch (err: any) {
      alert(`Permission creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRolePermissions = async () => {
    if (!editingRole) return;
    try {
      setSubmitting(true);
      await fetchApi(`/rbac/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          permissions: selectedPermissions,
          description: editingRole.description,
          accessScope: editingRole.accessScope,
        }),
      });

      alert('Role permissions updated successfully!');
      setEditingRole(null);
      loadData();
      refreshPermissions();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role '${roleName}'?`)) return;
    try {
      await fetchApi(`/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });
      alert('Role removed');
      loadData();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    permissions.forEach((p) => {
      const cat = p.category || 'GENERAL';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [permissions]);

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Roles & Permissions Architecture
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Define system roles, register custom granular permissions, and control operational authorizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700"
            title="Refresh Roles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreatePermissionOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700 flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Create Permission</span>
          </button>

          <button
            onClick={() => {
              setSelectedPermissions([]);
              setIsCreateRoleOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isSuperAdmin = role.code === 'ADMIN';
          const permCount = role.permissions?.length || 0;
          const hasAll = role.permissions?.includes('*') || role.permissions?.includes('all');

          return (
            <div
              key={role.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-bold">
                    {role.code}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{role.userCount ?? 0} users</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-3 tracking-tight">{role.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  {role.description || 'No description provided.'}
                </p>

                {/* Permissions Preview */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80">
                  <p className="text-[10px] uppercase font-bold text-neutral-500 mb-2">
                    Active Permissions ({hasAll ? 'ALL (*)' : permCount})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {hasAll ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                        * ALL PRIVILEGES (Super Admin)
                      </span>
                    ) : role.permissions && role.permissions.length > 0 ? (
                      role.permissions.slice(0, 6).map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-neutral-600">No permissions assigned.</span>
                    )}
                    {!hasAll && permCount > 6 && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                        +{permCount - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(role)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configure Permissions</span>
                </button>

                {!isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Catalog Registry Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-white text-base">Registered Permissions Taxonomy</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Granular access privileges available for role assignment across operations
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-300">
            {permissions.length} System Privileges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedPermissions).map(([category, items]) => (
            <div key={category} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {category}
              </span>
              <div className="mt-3 space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="text-xs">
                    <p className="font-mono font-semibold text-white">{item.id}</p>
                    <p className="text-[11px] text-neutral-400">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        title="Create New Operational Role"
        subtitle="Define role name, code, and assign active granular permissions"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Role Name
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. City Fleet Manager"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Unique Role Code
              </label>
              <input
                type="text"
                required
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                placeholder="e.g. FLEET_MANAGER"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white uppercase placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Role Description
            </label>
            <textarea
              rows={2}
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Outline role responsibilities and departmental scope..."
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Permissions Selector Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Assign Granular Permissions ({selectedPermissions.length} selected)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedPermissions(
                    selectedPermissions.length === permissions.length
                      ? []
                      : permissions.map((p) => p.id)
                  )
                }
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              {Object.entries(groupedPermissions).map(([cat, perms]) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    {cat}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p: any) => {
                      const checked = selectedPermissions.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all flex items-start gap-2 ${
                            checked
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                              checked
                                ? 'bg-emerald-500 border-emerald-400 text-neutral-950'
                                : 'border-neutral-700'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">{p.name}</p>
                            <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{p.id}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateRoleOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Creating Role...' : 'Save New Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Permission Modal */}
      <Modal
        isOpen={isCreatePermissionOpen}
        onClose={() => setIsCreatePermissionOpen(false)}
        title="Register New Permission"
        subtitle="Add a new capability to the access control taxonomy"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePermission} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Permission Code (Domain:Action)
            </label>
            <input
              type="text"
              required
              value={permCode}
              onChange={(e) => setPermCode(e.target.value)}
              placeholder="e.g. payouts:authorize or reports:export"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={permName}
              onChange={(e) => setPermName(e.target.value)}
              placeholder="e.g. Authorize Driver Payouts"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Functional Category
            </label>
            <select
              value={permCategory}
              onChange={(e) => setPermCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Operations">Operations</option>
              <option value="Riders & Fleet">Riders & Fleet</option>
              <option value="Orders">Orders</option>
              <option value="Finance">Finance</option>
              <option value="Administration">Administration</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={permDesc}
              onChange={(e) => setPermDesc(e.target.value)}
              placeholder="Describe access rights granted by this permission..."
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreatePermissionOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Permission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Permissions Modal */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Configure Role: ${editingRole?.name}`}
        subtitle={`Role Code: ${editingRole?.code} • Toggle permissions matrix`}
        maxWidth="2xl"
      >
        {editingRole && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Assigned Permissions ({selectedPermissions.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedPermissions(
                    selectedPermissions.length === permissions.length
                      ? []
                      : permissions.map((p) => p.id)
                  )
                }
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              {Object.entries(groupedPermissions).map(([cat, perms]) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    {cat}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p: any) => {
                      const checked =
                        selectedPermissions.includes(p.id) ||
                        selectedPermissions.includes('*') ||
                        selectedPermissions.includes('all');

                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all flex items-start gap-2 ${
                            checked
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                              checked
                                ? 'bg-emerald-500 border-emerald-400 text-neutral-950'
                                : 'border-neutral-700'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">{p.name}</p>
                            <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{p.id}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRolePermissions}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? 'Saving Changes...' : 'Update Permissions'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
