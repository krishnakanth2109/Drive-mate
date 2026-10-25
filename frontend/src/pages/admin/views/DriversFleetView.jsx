import React, { useState } from 'react';
import { 
  Car, 
  Phone, 
  Star, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_DRIVERS = [
  {
    id: 'RDR-001',
    name: 'Suresh Kumar',
    email: 'suresh.driver@gmail.com',
    phone: '+91 98801 33419',
    vehicleType: 'bike',
    vehiclePlate: 'KA-01-AB-1234',
    vehicleModel: 'Honda Activa 6G (Matte Black)',
    walletBalance: 3450.00,
    rating: 4.90,
    totalRides: 142,
    totalEarnings: 18450.00,
    isAvailable: true,
    status: 'active',
    joinedDate: '15 Jan 2025'
  },
  {
    id: 'RDR-002',
    name: 'Manjunath Reddy',
    email: 'manjunath.r@gmail.com',
    phone: '+91 97412 88901',
    vehicleType: 'auto',
    vehiclePlate: 'KA-04-E-9021',
    vehicleModel: 'Bajaj RE Auto Rickshaw',
    walletBalance: 4120.00,
    rating: 4.85,
    totalRides: 98,
    totalEarnings: 14200.00,
    isAvailable: true,
    status: 'active',
    joinedDate: '02 Feb 2025'
  },
  {
    id: 'RDR-003',
    name: 'Basavaraj Patil',
    email: 'basavaraj.p@gmail.com',
    phone: '+91 96112 44321',
    vehicleType: 'bike',
    vehiclePlate: 'KA-02-C-5544',
    vehicleModel: 'TVS Jupiter 125',
    walletBalance: 2800.00,
    rating: 4.75,
    totalRides: 64,
    totalEarnings: 8900.00,
    isAvailable: false,
    status: 'offline',
    joinedDate: '20 Mar 2025'
  },
  {
    id: 'RDR-004',
    name: 'Ravi Teja',
    email: 'ravi.teja@gmail.com',
    phone: '+91 94488 12390',
    vehicleType: 'car',
    vehiclePlate: 'KA-05-MN-7711',
    vehicleModel: 'Maruti Suzuki WagonR',
    walletBalance: 1950.00,
    rating: 4.92,
    totalRides: 87,
    totalEarnings: 24100.00,
    isAvailable: true,
    status: 'active',
    joinedDate: '10 Apr 2025'
  }
];

export function DriversFleetView() {
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);

  const handleToggleStatus = (driverId) => {
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? {
              ...d,
              status: d.status === 'active' ? 'suspended' : 'active',
              isAvailable: d.status === 'active' ? false : true
            }
          : d
      )
    );
    setSelectedDriver(null);
    setToast({
      title: 'Driver Status Updated',
      message: `Driver ${driverId} status toggled successfully.`,
      type: 'info'
    });
  };

  const columns = [
    {
      header: 'Driver & ID',
      render: r => (
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            {r.name}
            {r.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <div className="text-xs text-neutral-400 font-mono">{r.id} • {r.phone}</div>
        </div>
      )
    },
    {
      header: 'Vehicle Assigned',
      render: r => (
        <div>
          <div className="text-xs font-semibold text-white flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-amber-400" />
            {r.vehiclePlate}
          </div>
          <div className="text-[11px] text-neutral-400">{r.vehicleModel}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'vehicleType',
      render: r => (
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          {r.vehicleType}
        </span>
      )
    },
    {
      header: 'Rating & Trips',
      render: r => (
        <div>
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {r.rating.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400">{r.totalRides} trips completed</div>
        </div>
      )
    },
    {
      header: 'Wallet Balance',
      render: r => (
        <span className="text-sm font-bold text-emerald-400">
          ₹{r.walletBalance.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Status',
      render: r => (
        <StatusPill status={r.status === 'active' && r.isAvailable ? 'Active' : r.status === 'active' ? 'Offline' : 'Suspended'} size="sm" />
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedDriver(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Inspect
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Fleet & Driver Directory
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Registered fleet operators, ratings, vehicle allocations, and earnings wallets
        </p>
      </div>

      <DataTable
        title="Active Driver Roster"
        subtitle="Manage fleet operator compliance, verification badges, and service readiness"
        columns={columns}
        data={drivers}
        searchPlaceholder="Search drivers by name, plate number, phone, or ID..."
        searchKeys={['name', 'id', 'phone', 'vehiclePlate', 'vehicleModel']}
        filterKey="vehicleType"
        filterOptions={[
          { label: 'All Vehicle Types', value: 'all' },
          { label: 'Bikes', value: 'bike' },
          { label: 'Autos', value: 'auto' },
          { label: 'Cars', value: 'car' }
        ]}
      />

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <DetailModal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Profile: ${selectedDriver.name}`}
          subtitle={`Driver ID: ${selectedDriver.id} • Joined ${selectedDriver.joinedDate}`}
          badge={<StatusPill status={selectedDriver.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn variant="outline" onClick={() => setSelectedDriver(null)}>
                Close
              </QuickActionBtn>
              <QuickActionBtn
                variant={selectedDriver.status === 'active' ? 'danger' : 'primary'}
                onClick={() => handleToggleStatus(selectedDriver.id)}
              >
                {selectedDriver.status === 'active' ? 'Suspend Driver' : 'Reactivate Driver'}
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500">Phone Contact:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedDriver.phone}</p>
              </div>
              <div>
                <span className="text-neutral-500">Email Address:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedDriver.email}</p>
              </div>
              <div>
                <span className="text-neutral-500">Vehicle Model & Plate:</span>
                <p className="font-bold text-amber-400 text-sm mt-0.5">{selectedDriver.vehiclePlate}</p>
                <p className="text-neutral-400">{selectedDriver.vehicleModel}</p>
              </div>
              <div>
                <span className="text-neutral-500">Total Lifetime Earnings:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">₹{selectedDriver.totalEarnings.toFixed(2)}</p>
                <p className="text-neutral-400">Current Wallet: ₹{selectedDriver.walletBalance.toFixed(2)}</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white">Government ID & Police Clearance</h5>
                  <p className="text-neutral-400 text-[11px]">Valid Driving License, RC Book, and Background Check on file</p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold text-xs">VERIFIED</span>
            </div>
          </div>
        </DetailModal>
      )}

      {toast && (
        <NotificationToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
