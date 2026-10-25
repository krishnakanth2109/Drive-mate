import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Radio, 
  Sliders, 
  DollarSign,
  Clock,
  Car
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const CITY_ZONES = [
  { zone: 'Koramangala 5th Block', demandLevel: 'Extreme', activeDrivers: 18, pendingRiders: 42, surge: '1.8x', status: 'surge active' },
  { zone: 'Indiranagar 100ft Road', demandLevel: 'High', activeDrivers: 24, pendingRiders: 31, surge: '1.4x', status: 'surge active' },
  { zone: 'Whitefield ITPL Hub', demandLevel: 'Moderate', activeDrivers: 35, pendingRiders: 28, surge: '1.1x', status: 'normal' },
  { zone: 'MG Road Metro Station', demandLevel: 'High', activeDrivers: 19, pendingRiders: 27, surge: '1.3x', status: 'surge active' },
  { zone: 'Electronic City Phase 1', demandLevel: 'Low', activeDrivers: 40, pendingRiders: 12, surge: '1.0x', status: 'normal' },
  { zone: 'HSR Layout Sector 2', demandLevel: 'Moderate', activeDrivers: 22, pendingRiders: 24, surge: '1.1x', status: 'normal' },
];

export function ManagerDashboard() {
  const [zones, setZones] = useState(CITY_ZONES);
  const [selectedZone, setSelectedZone] = useState(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1.5');
  const [toast, setToast] = useState(null);

  const handleUpdateSurge = () => {
    if (!selectedZone) return;
    setZones(prev =>
      prev.map(z =>
        z.zone === selectedZone.zone
          ? { ...z, surge: `${surgeMultiplier}x`, status: Number(surgeMultiplier) > 1.0 ? 'surge active' : 'normal' }
          : z
      )
    );
    setSelectedZone(null);
    setToast({
      title: 'Surge Pricing Updated',
      message: `Surge in ${selectedZone.zone} set to ${surgeMultiplier}x. Dispatched to customer pricing engine.`,
      type: 'success'
    });
  };

  const handleBroadcastIncentive = () => {
    setToast({
      title: 'Driver Surge Incentive Broadcasted',
      message: '₹50/trip bonus notification pushed to 140 nearby drivers via Socket.IO.',
      type: 'info'
    });
  };

  const columns = [
    {
      header: 'City Sector / Transit Hub',
      accessor: 'zone',
      render: r => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-semibold text-white">{r.zone}</span>
        </div>
      )
    },
    {
      header: 'Demand Level',
      render: r => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
            r.demandLevel === 'Extreme'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : r.demandLevel === 'High'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {r.demandLevel}
        </span>
      )
    },
    {
      header: 'Available Drivers',
      accessor: 'activeDrivers',
      align: 'center',
      render: r => <span className="font-bold text-emerald-400">{r.activeDrivers}</span>
    },
    {
      header: 'Passenger Requests',
      accessor: 'pendingRiders',
      align: 'center',
      render: r => <span className="font-bold text-amber-400">{r.pendingRiders}</span>
    },
    {
      header: 'Active Multiplier',
      accessor: 'surge',
      align: 'center',
      render: r => (
        <span className="font-mono font-bold text-sm text-cyan-400 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
          {r.surge}
        </span>
      )
    },
    {
      header: 'Zone Status',
      render: r => <StatusPill status={r.status} size="sm" />
    },
    {
      header: 'Adjustment',
      align: 'right',
      render: r => (
        <button
          onClick={() => {
            setSelectedZone(r);
            setSurgeMultiplier(r.surge.replace('x', ''));
          }}
          className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Sliders className="w-3.5 h-3.5" /> Adjust
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              City Operations Command
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Metropolitan Demand & Surge Orchestration
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage city-wide supply/demand balance, surge multipliers, and hourly trip fulfillment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <QuickActionBtn
            variant="accent"
            icon={Radio}
            onClick={handleBroadcastIncentive}
          >
            Broadcast Driver Incentive
          </QuickActionBtn>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Live Rides"
          value="182"
          subtitle="Currently on road"
          icon={Activity}
          color="blue"
          trend="+14% peak hour"
          trendType="up"
        />
        <MetricCard
          title="Supply Deficit Gap"
          value="-34 Drivers"
          subtitle="Koramangala & Indiranagar"
          icon={AlertTriangle}
          color="rose"
          trend="Surge engaged"
          trendType="neutral"
        />
        <MetricCard
          title="Trip Completion Rate"
          value="96.2%"
          subtitle="Low driver cancellation"
          icon={TrendingUp}
          color="emerald"
          trend="+1.8%"
          trendType="up"
        />
        <MetricCard
          title="Peak Multiplier"
          value="1.8x"
          subtitle="Automatic algorithmic cap"
          icon={Flame}
          color="amber"
          trend="Max allowed: 2.5x"
          trendType="neutral"
        />
      </div>

      {/* Zones Table */}
      <DataTable
        title="Regional Sector Heatmap & Surge Controller"
        subtitle="Live supply/demand metrics per transit node with dynamic multiplier override"
        columns={columns}
        data={zones}
        searchPlaceholder="Filter sectors by name..."
        searchKeys={['zone', 'demandLevel', 'surge']}
        filterKey="status"
        filterOptions={[
          { label: 'All Sectors', value: 'all' },
          { label: 'Surge Active', value: 'surge active' },
          { label: 'Normal Pricing', value: 'normal' }
        ]}
      />

      {/* Surge Adjustment Modal */}
      {selectedZone && (
        <DetailModal
          isOpen={Boolean(selectedZone)}
          onClose={() => setSelectedZone(null)}
          title={`Dynamic Pricing Adjustment: ${selectedZone.zone}`}
          subtitle={`Current Demand: ${selectedZone.demandLevel} • Drivers: ${selectedZone.activeDrivers} vs Requests: ${selectedZone.pendingRiders}`}
          badge={<StatusPill status={selectedZone.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedZone(null)}
              >
                Cancel
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                onClick={handleUpdateSurge}
              >
                Apply Surge Rate
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-5 text-sm">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Surge Pricing Multiplier ({surgeMultiplier}x)
              </label>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={surgeMultiplier}
                onChange={e => setSurgeMultiplier(e.target.value)}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>1.0x (Standard Fare)</span>
                <span>1.5x (Moderate Surge)</span>
                <span>2.0x (High Rush)</span>
                <span>2.5x (Max Allowed)</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-2">
              <span className="text-neutral-400 font-semibold uppercase text-[10px]">Impact Preview</span>
              <div className="flex justify-between text-neutral-300">
                <span>Base 5km Bike Fare:</span>
                <span className="font-bold text-white">₹{Math.round(60 * Number(surgeMultiplier))} (normally ₹60)</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Driver Earnings Bonus:</span>
                <span className="font-bold text-emerald-400">+₹{Math.round(35 * (Number(surgeMultiplier) - 1))} per trip</span>
              </div>
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
