import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  RefreshCw, 
  Check, 
  CreditCard, 
  Car, 
  Calendar 
} from 'lucide-react';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import { fetchApi } from '../../../api/client';

export function UsersManager() {
  const [activeTab, setActiveTab] = useState<'staff' | 'customers'>('staff');
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  // Form State for User Creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffData, customerData, rolesData] = await Promise.all([
        fetchApi('/admin/list').catch(() => []),
        fetchApi('/admin/customers').catch(() => []),
        fetchApi('/rbac/roles').catch(() => []),
      ]);

      setStaffUsers(Array.isArray(staffData) ? staffData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      if (Array.isArray(rolesData)) setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load users data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await fetchApi('/admin/create', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
        }),
      });

      alert('Staff administrator user created successfully!');
      setIsCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      loadData();
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const staffColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-sm">{row.name}</p>
          <p className="text-xs text-neutral-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Access Role',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{row.role || 'Administrator'}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (row) => (
        <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'INACTIVE'} size="sm" />
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (row) => (
        <span className="text-xs text-neutral-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  const customerColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Passenger Name',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-sm">{row.name}</p>
          <p className="text-xs text-neutral-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Mobile Contact',
      render: (row) => (
        <span className="font-mono text-xs text-neutral-300">{row.phone || '—'}</span>
      ),
    },
    {
      key: 'walletBalance',
      header: 'Wallet Balance',
      render: (row) => (
        <span className="font-bold text-emerald-400 text-sm">
          ₹{Number(row.walletBalance ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'totalRides',
      header: 'Trips Completed',
      render: (row) => (
        <span className="text-xs font-semibold text-neutral-300">
          {row.totalRides ?? 0} rides
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge status="ACTIVE" size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Accounts & Community Management</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Users & Staff Account Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Provision staff administrators, assign operational roles, and monitor registered passenger commuters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Staff User</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'staff'
              ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
              : 'text-neutral-400 hover:text-white border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Staff Administrators ({staffUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'customers'
              ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
              : 'text-neutral-400 hover:text-white border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Registered Passengers ({customers.length})</span>
        </button>
      </div>

      {/* Main Table */}
      {activeTab === 'staff' ? (
        <DataTable
          columns={staffColumns}
          data={staffUsers}
          loading={loading}
          searchPlaceholder="Search staff by name or email..."
          searchableKey={(row) => `${row.name} ${row.email} ${row.role || ''}`}
          pageSize={10}
          emptyMessage="No staff administrators registered yet."
        />
      ) : (
        <DataTable
          columns={customerColumns}
          data={customers}
          loading={loading}
          searchPlaceholder="Search customers by name, phone, or email..."
          searchableKey={(row) => `${row.name} ${row.phone || ''} ${row.email || ''}`}
          pageSize={10}
          emptyMessage="No passenger commuter accounts found."
        />
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Staff Administrator"
        subtitle="Create administrator account with backend credentials and access role"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@drivemate.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Temporary Access Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Assigned Role Definition
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="admin">Administrator (Super Admin)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.code || r.name}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Creating in Database...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
