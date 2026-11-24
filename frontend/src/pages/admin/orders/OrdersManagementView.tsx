import React, { useEffect, useState } from 'react';
import { 
  Car, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Radio, 
  RefreshCw, 
  Eye, 
  IndianRupee, 
  User, 
  Calendar,
  Navigation
} from 'lucide-react';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import { fetchApi } from '../../../api/client';

export function OrdersManagementView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await fetchApi(`/admin/orders?${params.toString()}`);
      if (res) {
        setOrders(res.orders || []);
        if (res.statusMetrics) setMetrics(res.statusMetrics);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const columns: Column<any>[] = [
    {
      key: 'orderId',
      header: 'Order Reference',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-emerald-400 text-xs">
            #{row.id.slice(0, 8)}
          </span>
          <p className="text-[11px] text-neutral-500">
            {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.customer?.name || 'Commuter'}</p>
          <p className="text-[11px] text-neutral-400">{row.customer?.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'rider',
      header: 'Assigned Driver',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.rider?.name || 'Searching fleet...'}</p>
          <p className="text-[11px] text-neutral-400 uppercase">{row.vehicleType || 'BIKE'}</p>
        </div>
      ),
    },
    {
      key: 'pickup',
      header: 'Pickup & Destination',
      render: (row) => (
        <div className="max-w-xs space-y-0.5">
          <p className="text-xs text-white truncate font-medium">
            <span className="text-emerald-400 font-bold">From:</span> {row.pickupPlaceName || row.pickupAddress || 'Origin'}
          </p>
          <p className="text-xs text-neutral-400 truncate">
            <span className="text-blue-400 font-bold">To:</span> {row.dropPlaceName || row.dropAddress || 'Destination'}
          </p>
        </div>
      ),
    },
    {
      key: 'fare',
      header: 'Trip Fare',
      render: (row) => (
        <div>
          <span className="font-bold text-white text-sm">
            ₹{row.fare?.toLocaleString('en-IN') ?? 0}
          </span>
          {row.distance && (
            <p className="text-[11px] text-neutral-500">{row.distance} km</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Order Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          title="Inspect Order Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>Real-time Trip Lifecycle & Dispatch</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Orders & Ride Dispatch Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Monitor real-time ride orders, passenger requests, driver allocations, and trip completion telemetry.
          </p>
        </div>

        <button
          onClick={() => loadOrders()}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { id: 'all', label: 'All Orders', count: metrics.total ?? orders.length },
          { id: 'pending', label: 'Requested', count: metrics.pending ?? 0 },
          { id: 'accepted', label: 'Accepted', count: metrics.accepted ?? 0 },
          { id: 'in_progress', label: 'In Progress', count: metrics.in_progress ?? 0 },
          { id: 'completed', label: 'Completed', count: metrics.completed ?? 0 },
          { id: 'cancelled', label: 'Cancelled', count: metrics.cancelled ?? 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedStatus === tab.id
                ? 'bg-neutral-800 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{tab.label}</p>
            <p className="text-lg font-black text-white mt-1">{tab.count}</p>
          </button>
        ))}
      </div>

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Search order ID, passenger, driver, or address..."
        searchableKey={(row) =>
          `${row.id} ${row.customer?.name || ''} ${row.rider?.name || ''} ${row.pickupAddress || ''} ${row.dropAddress || ''}`
        }
        pageSize={10}
        emptyMessage={`No orders found for the status: ${selectedStatus.toUpperCase()}.`}
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Breakdown #${selectedOrder?.id?.slice(0, 8)}`}
        subtitle="Complete trip audit, passenger, driver, and routing details"
        maxWidth="2xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Top Status & Price Banner */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500">Current Trip State</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} size="md" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Trip Fare</p>
                <p className="text-2xl font-black text-emerald-400">
                  ₹{selectedOrder.fare?.toLocaleString('en-IN') ?? 0}
                </p>
              </div>
            </div>

            {/* Customer & Driver Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Passenger / Commuter</p>
                <p className="text-sm font-bold text-white mt-1">
                  {selectedOrder.customer?.name || 'Walk-in User'}
                </p>
                <p className="text-xs text-neutral-400">{selectedOrder.customer?.phone || 'No phone'}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedOrder.customer?.email || ''}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Assigned Driver</p>
                <p className="text-sm font-bold text-white mt-1">
                  {selectedOrder.rider?.name || 'Unassigned'}
                </p>
                <p className="text-xs text-neutral-400">{selectedOrder.rider?.phone || 'No phone'}</p>
                <p className="text-xs font-mono text-emerald-400 mt-0.5 uppercase">
                  {selectedOrder.vehicleType} • {selectedOrder.rider?.vehicle?.plate || 'Active'}
                </p>
              </div>
            </div>

            {/* Route Points */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pickup Point</span>
                </div>
                <p className="text-sm font-medium text-white mt-0.5">
                  {selectedOrder.pickupPlaceName || selectedOrder.pickupAddress || 'Address on record'}
                </p>
              </div>

              <div className="border-t border-neutral-800 pt-3">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Drop Destination</span>
                </div>
                <p className="text-sm font-medium text-white mt-0.5">
                  {selectedOrder.dropPlaceName || selectedOrder.dropAddress || 'Address on record'}
                </p>
              </div>
            </div>

            {/* Trip Telemetry */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Distance</p>
                <p className="text-sm font-bold text-white mt-1">
                  {selectedOrder.distance ? `${selectedOrder.distance} km` : '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Trip OTP</p>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {selectedOrder.otp || '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Duration</p>
                <p className="text-sm font-bold text-white mt-1">
                  {selectedOrder.duration ? `${selectedOrder.duration} mins` : '—'}
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <p>Requested: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              {selectedOrder.acceptedAt && <p>Accepted: {new Date(selectedOrder.acceptedAt).toLocaleString()}</p>}
              {selectedOrder.startedAt && <p>Started: {new Date(selectedOrder.startedAt).toLocaleString()}</p>}
              {selectedOrder.completedAt && <p>Completed: {new Date(selectedOrder.completedAt).toLocaleString()}</p>}
              {selectedOrder.cancellationReason && (
                <p className="text-rose-400 font-semibold">
                  Cancellation: {selectedOrder.cancellationReason} (by {selectedOrder.cancelledBy || 'User'})
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
