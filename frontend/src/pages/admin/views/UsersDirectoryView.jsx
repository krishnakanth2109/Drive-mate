import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Phone, 
  Mail, 
  Wallet, 
  Coins, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

export function UsersDirectoryView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('vlt_master_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const config = token ? { headers: { 'x-auth-token': token } } : {};

    try {
      const res = await axios.get(`${API_URL}/admin/customers`, config);
      const data = res.data?.data || res.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customers from backend:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    {
      header: 'Customer',
      render: r => (
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            {r.name}
            {r.powerPass && (
              <span className="p-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="PowerPass Subscriber">
                <Zap className="w-3 h-3 fill-amber-400" />
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-400 font-mono">{r.id || r._id}</div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: r => (
        <div className="text-xs">
          <div className="text-neutral-300 font-medium">{r.phone || 'N/A'}</div>
          <div className="text-neutral-400">{r.email || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Wallet Balance',
      render: r => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400 text-sm">₹{Number(r.walletBalance || 0).toFixed(2)}</span>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
            <Coins className="w-3 h-3" /> {r.coinBalance ?? Math.floor((r.walletBalance || 0) * 1.5)} DriveCoins
          </div>
        </div>
      )
    },
    {
      header: 'PowerPass Plan',
      render: r => (
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
          r.powerPass ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'
        }`}>
          {r.powerPass ? <Zap className="w-3 h-3 fill-amber-400" /> : null}
          {r.powerPass ? 'Active Monthly' : 'Standard'}
        </span>
      )
    },
    {
      header: 'Completed Rides',
      accessor: 'totalRides',
      align: 'center',
      render: r => <span className="font-semibold text-white">{r.totalRides ?? 0} trips</span>
    },
    {
      header: 'Account Status',
      render: r => <StatusPill status={r.status || 'active'} size="sm" />
    },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedCustomer(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-blue-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> View Profile
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Passenger & User Accounts
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Registered customer profiles, ride history, wallet balances, and PowerPass memberships
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      <DataTable
        title="Customer Directory"
        subtitle="Live passenger account details fetched directly from database"
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customers by name, email, phone or ID..."
        searchKeys={['name', 'email', 'phone', 'id', '_id']}
      />

      {/* Customer Detail Inspection Modal */}
      {selectedCustomer && (
        <DetailModal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Passenger Profile: ${selectedCustomer.name}`}
          subtitle={`Account ID: ${selectedCustomer.id || selectedCustomer._id}`}
          badge={<StatusPill status={selectedCustomer.status || 'active'} size="sm" />}
          actions={
            <QuickActionBtn variant="secondary" onClick={() => setSelectedCustomer(null)}>
              Close
            </QuickActionBtn>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 font-medium">Full Name:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedCustomer.name}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Registered Phone:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Email Address:</span>
                <p className="font-medium text-neutral-300 text-sm mt-0.5">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Wallet Balance:</span>
                <p className="font-extrabold text-emerald-400 text-base mt-0.5">
                  ₹{Number(selectedCustomer.walletBalance || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
              <div>
                <span className="text-neutral-500">Total Rides</span>
                <p className="text-white font-bold text-base mt-1">{selectedCustomer.totalRides || 0}</p>
              </div>
              <div>
                <span className="text-neutral-500">Loyalty Coins</span>
                <p className="text-amber-400 font-bold text-base mt-1">
                  {selectedCustomer.coinBalance ?? Math.floor((selectedCustomer.walletBalance || 0) * 1.5)}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Joined</span>
                <p className="text-neutral-300 font-medium text-xs mt-1">
                  {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
