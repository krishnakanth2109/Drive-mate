import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  Car,
  RefreshCw
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';
import { adminApi } from '../../../api/adminApi';

export function ManagerDashboard() {
  const [zones, setZones] = useState([]);
  const [metrics, setMetrics] = useState({
    liveRidesCount: 0,
    activeSupplyDrivers: 0,
    activeCityZones: 0,
    avgEtaMinutes: 0,
    fulfillmentRate: '0.0%',
    activeSurgeZones: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1.5');
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchOperationsData = useCallback(async () => {
    setLoading(true);
    try {
      const [zonesData, metricsData] = await Promise.all([
        adminApi.getCityZones(),
        adminApi.getOperationsMetrics(),
      ]);

      const raw = Array.isArray(zonesData) ? zonesData : [];
      const mapped = raw.map((z) => ({
        id: z.id,
        rawId: z.id,
        zone: z.name || 'City Sector',
        demandLevel: z.demandLevel || 'Moderate',
        activeDrivers: z.activeDrivers || 0,
        pendingRiders: z.pendingRiders || 0,
        surge: `${Number(z.surgeMultiplier || 1.0).toFixed(1)}x`,
        surgeMultiplier: Number(z.surgeMultiplier || 1.0),
        status: z.status === 'surge_active' || Number(z.surgeMultiplier) > 1.0 ? 'surge active' : 'normal'
      }));
      setZones(mapped);

      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to load operations data:', err);
      setToast({
        title: 'Load Error',
        message: err.message || 'Unable to fetch operations data.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperationsData();
  }, [fetchOperationsData]);

  const handleUpdateSurge = async () => {
    if (!selectedZone) return;
    const targetId = selectedZone.rawId || selectedZone.id;
    const multVal = parseFloat(surgeMultiplier) || 1.0;
    const newDemand = multVal >= 1.5 ? 'Extreme' : (multVal > 1.0 ? 'High' : 'Moderate');

    setProcessing(true);
    try {
      await adminApi.updateZoneSurge(targetId, {
        surgeMultiplier: multVal,
        demandLevel: newDemand,
        reason: 'Manager manual surge multiplier adjustment via operations console'
      });

      setZones((prev) =>
        prev.map((z) =>
          (z.rawId === targetId || z.id === targetId)
            ? { ...z, surge: `${multVal.toFixed(1)}x`, surgeMultiplier: multVal, demandLevel: newDemand, status: multVal > 1.0 ? 'surge active' : 'normal' }
            : z
        )
      );
      setSelectedZone(null);
      setToast({
        title: 'Surge Pricing Updated',
        message: `Surge in ${selectedZone.zone} set to ${multVal.toFixed(1)}x.`,
        type: 'success'
      });
      fetchOperationsData();
    } catch (err) {
      console.error('Surge update error:', err);
      setToast({
        title: 'Update Failed',
        message: err.message || 'Could not update surge multiplier.',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBroadcastIncentive = async () => {
    setProcessing(true);
    try {
      await adminApi.createBroadcast({
        title: 'Peak Rain Surge Bonus: +₹50 Per Completed Ride',
        bonusAmount: 50,
        targetZone: selectedZone?.zone || 'All High-Demand City Zones',
        message: 'High demand alert. Complete trips in surge sectors to unlock instant driver cash bonuses.'
      });

      setToast({
        title: 'Driver Surge Incentive Broadcasted',
        message: '₹50/trip bonus notification pushed to active drivers via Socket.IO.',
        type: 'info'
      });
    } catch (err) {
      console.error('Broadcast error:', err);
      setToast({
        title: 'Broadcast Failed',
        message: err.message || 'Could not send driver incentive broadcast.',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
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
      header: 'Active Surge',
      accessor: 'surge',
      align: 'center',
      render: r => (
        <span className={`font-extrabold ${r.surge !== '1.0x' ? 'text-rose-400' : 'text-neutral-400'}`}>
          {r.surge}
        </span>
      )
    },
    { header: 'Status', render: r => <StatusPill status={r.status} size="sm" /> },
    {
      header: 'Pricing Control',
      align: 'right',
      render: r => (
        <button
          onClick={() => {
            setSelectedZone(r);
            setSurgeMultiplier(r.surge.replace('x', ''));
          }}
          className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors font-medium flex items-center gap-1.5 ml-auto"
        >
          <Sliders className="w-3.5 h-3.5" /> Adjust Surge
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
              Operations Manager Console
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Metropolitan Dispatch & Dynamic Surge Orchestration
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time supply/demand equilibrium, algorithmic dynamic pricing, and driver fleet incentive dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOperationsData}
            disabled={loading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors"
            title="Refresh Operations Zones"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <QuickActionBtn
            variant="primary"
            icon={Radio}
            disabled={processing}
            onClick={handleBroadcastIncentive}
          >
            Broadcast Driver Incentive
          </QuickActionBtn>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Live Trips"
          value={metrics.liveRidesCount || 0}
          subtitle="Currently on road"
          icon={Activity}
          color="blue"
          trend="Real-time"
          trendType="up"
        />
        <MetricCard
          title="Active City Drivers"
          value={metrics.activeSupplyDrivers || 0}
          subtitle="Available for matching"
          icon={Car}
          color="emerald"
          trend={`${metrics.fulfillmentRate || '0.0%'} fulfillment`}
          trendType="up"
        />
        <MetricCard
          title="Surge Active Zones"
          value={zones.filter(z => z.surgeMultiplier > 1.0).length}
          subtitle={`Across ${zones.length} monitored sectors`}
          icon={Flame}
          color="rose"
          trend="Dynamic pricing"
          trendType="neutral"
        />
        <MetricCard
          title="Avg Dispatch ETA"
          value={`${metrics.avgEtaMinutes ?? 0} mins`}
          subtitle="Metropolitan dispatch benchmark"
          icon={Clock}
          color="cyan"
          trend="Optimal match"
          trendType="up"
        />
      </div>

      {/* City Zones Table */}
      <DataTable
        title="City Hub Dispatch & Demand Overview"
        subtitle="Live supply/demand ratios and dynamic surge multipliers across key corridors"
        columns={columns}
        data={zones}
        searchPlaceholder="Search sectors by zone name..."
        searchKeys={['zone', 'demandLevel']}
        filterKey="demandLevel"
        filterOptions={[
          { label: 'All Demand', value: 'all' },
          { label: 'Extreme Demand', value: 'Extreme' },
          { label: 'High Demand', value: 'High' },
          { label: 'Moderate Demand', value: 'Moderate' },
          { label: 'Low Demand', value: 'Low' }
        ]}
      />

      {/* Surge Adjustment Modal */}
      {selectedZone && (
        <DetailModal
          isOpen={Boolean(selectedZone)}
          onClose={() => setSelectedZone(null)}
          title={`Adjust Dynamic Surge: ${selectedZone.zone}`}
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
                icon={Flame}
                disabled={processing}
                onClick={handleUpdateSurge}
              >
                Apply Multiplier ({surgeMultiplier}x)
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current Base Fare Multiplier:</span>
                <span className="text-white font-bold text-sm">{selectedZone.surge}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Active Supply Deficit:</span>
                <span className="text-amber-400 font-bold">
                  {Math.max(0, selectedZone.pendingRiders - selectedZone.activeDrivers)} Unassigned Riders
                </span>
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-2">
                Set Dynamic Surge Multiplier (1.0x - 3.0x):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={surgeMultiplier}
                  onChange={e => setSurgeMultiplier(e.target.value)}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xl font-extrabold text-blue-400 font-mono w-16 text-right">
                  {surgeMultiplier}x
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-neutral-300 text-xs leading-relaxed">
              Updating this surge rule will immediately synchronize customer booking fare quotes and broadcast incentives to idle drivers in adjacent sectors.
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
