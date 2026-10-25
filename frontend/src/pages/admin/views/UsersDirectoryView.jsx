import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Wallet, 
  Coins, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

const MOCK_CUSTOMERS = [
  { id: 'CUST-001', name: 'Krishna Kanth', email: 'kkanth@gmail.com', phone: '+91 98845 11002', walletBalance: 250.00, coinBalance: 420, powerPass: true, totalRides: 18, joinedDate: '10 Jan 2025', status: 'active' },
  { id: 'CUST-002', name: 'Pooja Hegde', email: 'pooja.h@gmail.com', phone: '+91 98845 22109', walletBalance: 120.00, coinBalance: 150, powerPass: false, totalRides: 8, joinedDate: '14 Feb 2025', status: 'active' },
  { id: 'CUST-003', name: 'Ananya Roy', email: 'ananya.roy@gmail.com', phone: '+91 94432 88712', walletBalance: 45.00, coinBalance: 80, powerPass: true, totalRides: 12, joinedDate: '01 Mar 2025', status: 'active' },
  { id: 'CUST-004', name: 'Vikram Joshi', email: 'vikram.j@gmail.com', phone: '+91 91122 33445', walletBalance: 0.00, coinBalance: 20, powerPass: false, totalRides: 3, joinedDate: '22 Mar 2025', status: 'active' },
  { id: 'CUST-005', name: 'Rahul Varma', email: 'rahul.v@gmail.com', phone: '+91 95544 33221', walletBalance: 680.00, coinBalance: 590, powerPass: true, totalRides: 29, joinedDate: '05 Jan 2025', status: 'active' },
];

export function UsersDirectoryView() {
  const [customers] = useState(MOCK_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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
          <div className="text-xs text-neutral-400">{r.id}</div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: r => (
        <div className="text-xs">
          <div className="text-neutral-300">{r.phone}</div>
          <div className="text-neutral-400">{r.email}</div>
        </div>
      )
    },
    {
      header: 'Wallet Balance',
      render: r => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400 text-sm">₹{r.walletBalance.toFixed(2)}</span>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
            <Coins className="w-3 h-3" /> {r.coinBalance} DriveCoins
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
          {r.powerPass ? 'Active Monthly' : 'None'}
        </span>
      )
    },
    {
      header: 'Completed Rides',
      accessor: 'totalRides',
      align: 'center',
      render: r => <span className="font-semibold text-white">{r.totalRides} trips</span>
    },
    {
      header: 'Account Status',
      render: r => <StatusPill status={r.status} size="sm" />
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Passenger & User Accounts
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Registered customer profiles, ride history, wallet balances, and PowerPass memberships
        </p>
      </div>

      <DataTable
        title="Customer Directory"
        subtitle="Search and view passenger account details, loyalty tiers, and contact numbers"
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers by name, email, phone or ID..."
        searchKeys={['name', 'email', 'phone', 'id']}
      />

      {selectedCustomer && (
        <DetailModal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.name}`}
          subtitle={`${selectedCustomer.id} • Registered Member`}
          badge={<StatusPill status={selectedCustomer.status} size="sm" />}
          actions={
            <QuickActionBtn variant="secondary" onClick={() => setSelectedCustomer(null)}>
              Close
            </QuickActionBtn>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500">Phone:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div>
                <span className="text-neutral-500">Email:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedCustomer.email}</p>
              </div>
              <div>
                <span className="text-neutral-500">DriveMate Wallet Balance:</span>
                <p className="font-extrabold text-emerald-400 text-base mt-0.5">₹{selectedCustomer.walletBalance.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-neutral-500">Reward Coins:</span>
                <p className="font-bold text-amber-400 text-base mt-0.5">{selectedCustomer.coinBalance} Coins</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">PowerPass Subscription</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  {selectedCustomer.powerPass ? 'Active Monthly Pass (Free priority dispatch + 10% discount on peak rides)' : 'No active subscription'}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                selectedCustomer.powerPass ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {selectedCustomer.powerPass ? 'Active' : 'Not Enrolled'}
              </span>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
