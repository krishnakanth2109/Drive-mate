import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Car, 
  Users, 
  PieChart, 
  TrendingUp, 
  Award, 
  MapPin, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_COACHES = [
  { id: 'FCH-01', name: 'Vikram Singh', zone: 'Bangalore East (Indiranagar / Whitefield)', activeDrivers: 124, pendingReviews: 4, complianceRate: '98.5%', status: 'active' },
  { id: 'FCH-02', name: 'Sunil Gowda', zone: 'Bangalore South (Koramangala / HSR)', activeDrivers: 98, pendingReviews: 8, complianceRate: '96.2%', status: 'active' },
  { id: 'FCH-03', name: 'Preeti Deshmukh', zone: 'Bangalore North (Hebbal / Airport)', activeDrivers: 110, pendingReviews: 3, complianceRate: '99.1%', status: 'active' },
  { id: 'FCH-04', name: 'Imran Khan', zone: 'Bangalore West (Rajajinagar / Vijayanagar)', activeDrivers: 85, pendingReviews: 7, complianceRate: '94.8%', status: 'active' },
];

const FLEET_BREAKDOWN = [
  { type: 'Bike Taxi', count: 245, activeRate: '88%', revenueShare: '42%', color: 'text-amber-400', bar: 'bg-amber-500' },
  { type: 'Scooty Rental', count: 112, activeRate: '92%', revenueShare: '24%', color: 'text-emerald-400', bar: 'bg-emerald-500' },
  { type: 'Auto Rickshaw', count: 88, activeRate: '84%', revenueShare: '21%', color: 'text-cyan-400', bar: 'bg-cyan-500' },
  { type: 'Sedan / Hatchback', count: 45, activeRate: '79%', revenueShare: '13%', color: 'text-purple-400', bar: 'bg-purple-500' },
];

export function HeadOfFleetCoachDashboard() {
  const [coaches] = useState(MOCK_COACHES);
  const [toast, setToast] = useState(null);

  const columns = [
    { header: 'Coach ID', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-orange-400">{r.id}</span> },
    { header: 'Fleet Coach', accessor: 'name', render: r => <span className="font-semibold text-white">{r.name}</span> },
    { header: 'Assigned Territory', accessor: 'zone', render: r => <span className="text-xs text-neutral-300">{r.zone}</span> },
    { header: 'Managed Fleet', accessor: 'activeDrivers', align: 'center', render: r => <span className="font-bold text-white">{r.activeDrivers} Drivers</span> },
    { header: 'Pending Queue', accessor: 'pendingReviews', align: 'center', render: r => <span className="text-amber-400 font-bold">{r.pendingReviews}</span> },
    { header: 'Compliance Rate', accessor: 'complianceRate', align: 'center', render: r => <span className="text-emerald-400 font-bold">{r.complianceRate}</span> },
    { header: 'Status', render: r => <StatusPill status={r.status} size="sm" /> }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Head of Fleet Coach Leadership
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Metropolitan Fleet Quality & Capacity Control
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Territory coach assignments, vehicle segment distribution, and regulatory safety adherence
          </p>
        </div>

        <QuickActionBtn
          variant="primary"
          icon={Award}
          onClick={() => {
            setToast({
              title: 'Safety Audit Initiated',
              message: 'Quarterly fleet inspection broadcast dispatched to all coaches.',
              type: 'success'
            });
          }}
        >
          Dispatch Safety Directive
        </QuickActionBtn>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Fleet Size"
          value="490 Vehicles"
          subtitle="Across 4 categories"
          icon={Car}
          color="orange"
          trend="+32 this month"
          trendType="up"
        />
        <MetricCard
          title="Fleet Compliance Rate"
          value="97.4%"
          subtitle="Valid RC, DL & Insurance"
          icon={ShieldCheck}
          color="emerald"
          trend="+0.8%"
          trendType="up"
        />
        <MetricCard
          title="Driver Retention Index"
          value="91.2%"
          subtitle="90-day active threshold"
          icon={TrendingUp}
          color="cyan"
          trend="+2.4%"
          trendType="up"
        />
        <MetricCard
          title="Territory Coaches"
          value={coaches.length}
          subtitle="Covering all 4 city sectors"
          icon={Users}
          color="purple"
          trend="Fully staffed"
          trendType="neutral"
        />
      </div>

      {/* Fleet Distribution Breakdown */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white tracking-tight mb-1">
          Vehicle Category Breakdown & Utilization
        </h3>
        <p className="text-xs text-neutral-400 mb-6">
          Real-time fleet inventory segmentation across city corridors
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLEET_BREAKDOWN.map(seg => (
            <div key={seg.type} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-neutral-300">{seg.type}</span>
                <span className={`text-xs font-bold ${seg.color}`}>{seg.revenueShare} GMV</span>
              </div>
              <div className="text-2xl font-extrabold text-white">{seg.count}</div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                <span>Active Utilization:</span>
                <span className="text-emerald-400 font-semibold">{seg.activeRate}</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${seg.bar}`} style={{ width: seg.activeRate }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Coaches Table */}
      <DataTable
        title="Territory Fleet Coaches & Inspection Throughput"
        subtitle="Regional coach performance, open driver queues, and vehicle pass rates"
        columns={columns}
        data={coaches}
        searchPlaceholder="Search fleet coaches by name, zone or ID..."
        searchKeys={['name', 'id', 'zone']}
      />

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
