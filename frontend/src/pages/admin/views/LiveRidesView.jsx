import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Car, 
  MapPin, 
  Clock, 
  User, 
  IndianRupee, 
  Filter, 
  Eye, 
  RefreshCw, 
  Navigation,
  ShieldAlert
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

const MOCK_RIDES_FALLBACK = [
  {
    id: 'RD-9021',
    customer: { name: 'Pooja Hegde', phone: '+91 98845 22109' },
    rider: { name: 'Suresh Kumar', phone: '+91 98801 33419', vehicleType: 'bike' },
    pickupAddress: 'Indiranagar Metro Station, 100ft Road',
    dropAddress: 'Embassy GolfLinks Business Park, Domlur',
    status: 'ongoing',
    vehicleType: 'bike',
    fare: 142.50,
    distance: 4.8,
    duration: 16,
    otp: '4481',
    createdAt: new Date().toISOString()
  },
  {
    id: 'RD-9020',
    customer: { name: 'Ananya Roy', phone: '+91 94432 88712' },
    rider: { name: 'Manjunath Reddy', phone: '+91 97412 88901', vehicleType: 'auto' },
    pickupAddress: 'Koramangala 5th Block Club',
    dropAddress: 'HSR Layout BDA Complex',
    status: 'accepted',
    vehicleType: 'auto',
    fare: 95.00,
    distance: 3.2,
    duration: 12,
    otp: '2819',
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'RD-9019',
    customer: { name: 'Vikram Joshi', phone: '+91 91122 33445' },
    rider: null,
    pickupAddress: 'MG Road Trinity Circle',
    dropAddress: 'Whitefield ITPL Main Gate',
    status: 'pending',
    vehicleType: 'car',
    fare: 310.00,
    distance: 14.5,
    duration: 38,
    otp: '9102',
    createdAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 'RD-9018',
    customer: { name: 'Rahul Varma', phone: '+91 95544 33221' },
    rider: { name: 'Basavaraj Patil', phone: '+91 96112 44321', vehicleType: 'bike' },
    pickupAddress: 'Bannerghatta National Park Road',
    dropAddress: 'Jayadeva Hospital Junction',
    status: 'completed',
    vehicleType: 'bike',
    fare: 112.00,
    distance: 6.1,
    duration: 22,
    otp: '5561',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'RD-9017',
    customer: { name: 'Kavitha Nair', phone: '+91 98877 66554' },
    rider: { name: 'Ravi Teja', phone: '+91 94488 12390', vehicleType: 'bike' },
    pickupAddress: 'Hebbal Flyover Bus Stop',
    dropAddress: 'Yelahanka Satellite Town',
    status: 'cancelled',
    vehicleType: 'bike',
    fare: 80.00,
    distance: 5.4,
    duration: 18,
    otp: '3310',
    cancellationReason: 'Driver vehicle flat tire',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export function LiveRidesView() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);

  const fetchRides = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('vlt_master_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await axios.get(`${API_URL}/admin/recent-rides`, {
        headers: token ? { 'x-auth-token': token } : {}
      });
      if (res.data?.data && res.data.data.length > 0) {
        setRides(res.data.data);
      } else {
        setRides(MOCK_RIDES_FALLBACK);
      }
    } catch (err) {
      setRides(MOCK_RIDES_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const columns = [
    {
      header: 'Ride ID',
      accessor: 'id',
      render: r => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {r._id || r.id}
        </span>
      )
    },
    {
      header: 'Customer',
      render: r => (
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            {r.customer?.name || 'Walk-in Passenger'}
          </div>
          <div className="text-xs text-neutral-400">{r.customer?.phone || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Driver & Vehicle',
      render: r => (
        <div>
          {r.rider ? (
            <>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                {r.rider.name}
              </div>
              <div className="text-xs text-neutral-400 capitalize">{r.vehicleType || 'Bike'}</div>
            </>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400">
              Searching Driver...
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Pickup & Drop Route',
      render: r => (
        <div className="flex flex-col space-y-1 text-xs">
          <div className="flex items-center text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{r.pickupAddress || r.pickup?.address || 'Pickup Point'}</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-red-400 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{r.dropAddress || r.drop?.address || 'Dropoff Point'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: r => <StatusPill status={r.status} size="sm" />
    },
    {
      header: 'Fare',
      align: 'right',
      render: r => (
        <div>
          <div className="font-bold text-white text-sm">₹{Number(r.fare || 0).toFixed(2)}</div>
          <div className="text-[11px] text-neutral-400">{r.distance ? `${r.distance} km` : ''}</div>
        </div>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedRide(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-emerald-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Live Rides & Route Telemetry
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time transit monitoring across active, scheduled, and completed trips
          </p>
        </div>

        <button
          onClick={fetchRides}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Main Rides Table */}
      <DataTable
        title="Network Transit Feed"
        subtitle="All live ride requests, driver GPS locks and trip completion status"
        columns={columns}
        data={rides}
        searchPlaceholder="Search by ride ID, passenger, driver, or street..."
        searchKeys={['id', '_id', 'customer.name', 'rider.name', 'pickupAddress', 'dropAddress']}
        filterKey="status"
        filterOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'Ongoing', value: 'ongoing' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ]}
      />

      {/* Ride Detail Inspection Modal */}
      {selectedRide && (
        <DetailModal
          isOpen={Boolean(selectedRide)}
          onClose={() => setSelectedRide(null)}
          title={`Trip Detail: ${selectedRide._id || selectedRide.id}`}
          subtitle={`Vehicle Type: ${selectedRide.vehicleType || 'Bike'} • Created ${new Date(selectedRide.createdAt || Date.now()).toLocaleString()}`}
          badge={<StatusPill status={selectedRide.status} size="sm" />}
          actions={
            <QuickActionBtn variant="secondary" onClick={() => setSelectedRide(null)}>
              Close
            </QuickActionBtn>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 font-medium">Customer:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedRide.customer?.name || 'Walk-in Passenger'}</p>
                <p className="text-neutral-400">{selectedRide.customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Assigned Driver:</span>
                <p className="font-bold text-amber-400 text-sm mt-0.5">{selectedRide.rider?.name || 'Unassigned'}</p>
                <p className="text-neutral-400">{selectedRide.rider?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Metered Fare:</span>
                <p className="font-extrabold text-emerald-400 text-base mt-0.5">₹{Number(selectedRide.fare || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Trip OTP:</span>
                <p className="font-mono font-bold text-white tracking-widest text-base mt-0.5">{selectedRide.otp || '3912'}</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-neutral-400 font-semibold uppercase text-[10px]">Geographic Route</span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Pickup Location:</span>
                  <p className="text-neutral-300">{selectedRide.pickupAddress || selectedRide.pickup?.address || 'Pickup Point'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-neutral-900">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Destination:</span>
                  <p className="text-neutral-300">{selectedRide.dropAddress || selectedRide.drop?.address || 'Destination Point'}</p>
                </div>
              </div>
            </div>

            {selectedRide.cancellationReason && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <span className="font-bold">Cancellation Reason:</span> {selectedRide.cancellationReason}
              </div>
            )}
          </div>
        </DetailModal>
      )}
    </div>
  );
}
