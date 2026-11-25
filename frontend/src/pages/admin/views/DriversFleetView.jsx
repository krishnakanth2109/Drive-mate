import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Car, 
  Phone, 
  Star, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function DriversFleetView() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('vlt_master_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const config = token ? { headers: { 'x-auth-token': token } } : {};

    try {
      const res = await axios.get(`${API_URL}/admin/drivers`, config);
      const data = res.data?.data || res.data || [];
      const formatted = (Array.isArray(data) ? data : []).map(d => ({
        ...d,
        vehiclePlate: d.vehicle?.plate || d.vehicle?.plateNumber || 'KA-01-AB-1234',
        vehicleModel: d.vehicle?.model ? `${d.vehicle.make || ''} ${d.vehicle.model}`.trim() : (d.vehicleType || 'Bike'),
        totalRides: d.completedRides || d.totalRides || 0,
        status: d.status || (d.isAvailable ? 'active' : 'offline'),
      }));
      setDrivers(formatted);
    } catch (err) {
      console.error('Failed to fetch drivers from backend:', err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleToggleStatus = (driverId) => {
    setDrivers(prev =>
      prev.map(d =>
        (d.id === driverId || d._id === driverId)
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
      message: `Driver status toggled successfully.`,
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
          <div className="text-xs text-neutral-400 font-mono">{r.id || r._id} • {r.phone}</div>
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
          {r.vehicleType || 'Bike'}
        </span>
      )
    },
    {
      header: 'Rating',
      render: r => (
        <div className="flex items-center gap-1 font-semibold text-white text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {Number(r.rating || 4.9).toFixed(1)}
        </div>
      )
    },
    {
      header: 'Total Completed',
      accessor: 'totalRides',
      align: 'center',
      render: r => <span className="font-semibold text-white text-xs">{r.totalRides || 0} trips</span>
    },
    {
      header: 'Wallet Balance',
      render: r => (
        <span className="font-bold text-emerald-400 text-sm">
          ₹{Number(r.walletBalance || 0).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Fleet Status',
      render: r => <StatusPill status={r.status || 'offline'} size="sm" />
    },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedDriver(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Manage
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toast && (
        <NotificationToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Drivers & Fleet Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time driver roster, vehicle inspection records, earnings balances, and duty dispatch
          </p>
        </div>

        <button
          onClick={fetchDrivers}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Roster
        </button>
      </div>

      <DataTable
        title="Active Driver Partner Fleet"
        subtitle="Live driver profiles fetched directly from database"
        columns={columns}
        data={drivers}
        loading={loading}
        searchPlaceholder="Search drivers by name, phone, plate, or vehicle..."
        searchKeys={['name', 'phone', 'vehiclePlate', 'vehicleModel', 'vehicleType', 'id', '_id']}
      />

      {/* Driver Detail Inspection Modal */}
      {selectedDriver && (
        <DetailModal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Partner Profile: ${selectedDriver.name}`}
          subtitle={`Rider ID: ${selectedDriver.id || selectedDriver._id} • ${selectedDriver.vehicleModel}`}
          badge={<StatusPill status={selectedDriver.status} size="sm" />}
          actions={
            <div className="flex gap-2">
              <QuickActionBtn
                variant={selectedDriver.status === 'active' ? 'danger' : 'success'}
                onClick={() => handleToggleStatus(selectedDriver.id || selectedDriver._id)}
              >
                {selectedDriver.status === 'active' ? 'Suspend Driver' : 'Activate Driver'}
              </QuickActionBtn>
              <QuickActionBtn variant="secondary" onClick={() => setSelectedDriver(null)}>
                Close
              </QuickActionBtn>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 font-medium">Contact Number:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedDriver.phone}</p>
                <p className="text-neutral-400">{selectedDriver.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Vehicle Plate:</span>
                <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">{selectedDriver.vehiclePlate}</p>
                <p className="text-neutral-400 capitalize">{selectedDriver.vehicleType} • {selectedDriver.vehicleModel}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Wallet Balance:</span>
                <p className="font-extrabold text-emerald-400 text-base mt-0.5">
                  ₹{Number(selectedDriver.walletBalance || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Overall Rating:</span>
                <div className="flex items-center gap-1 text-white font-bold text-base mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {Number(selectedDriver.rating || 4.9).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
              <div>
                <span className="text-neutral-500">Completed Trips</span>
                <p className="text-white font-bold text-base mt-1">{selectedDriver.totalRides || 0}</p>
              </div>
              <div>
                <span className="text-neutral-500">Fleet Availability</span>
                <p className={`font-bold text-base mt-1 ${selectedDriver.isAvailable ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {selectedDriver.isAvailable ? 'Online & Available' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
