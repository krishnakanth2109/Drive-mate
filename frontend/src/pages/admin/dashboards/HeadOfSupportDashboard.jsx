import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertOctagon, 
  Award, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  X, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_AGENTS = [
  { id: 'AGT-101', name: 'Priya Sharma', handled: 42, resolved: 39, avgTime: '2.8m', csat: '96.2%', status: 'active' },
  { id: 'AGT-102', name: 'Naveen Rao', handled: 38, resolved: 35, avgTime: '3.1m', csat: '94.0%', status: 'active' },
  { id: 'AGT-103', name: 'Deepa Menon', handled: 29, resolved: 27, avgTime: '3.4m', csat: '91.8%', status: 'in review' },
  { id: 'AGT-104', name: 'Rahul Joshi', handled: 45, resolved: 44, avgTime: '2.2m', csat: '98.5%', status: 'active' },
];

const MOCK_ESCALATIONS = [
  {
    id: 'ESC-402',
    ticketId: 'TCK-8091',
    customer: 'Amitabh Sengupta',
    driver: 'Mahesh K (KA-05-8812)',
    category: 'Severe Driver Misconduct',
    amount: '₹450',
    requestedAction: 'Full Fare Refund + Driver Penalty',
    reason: 'Driver verbally abused passenger after route dispute and refused drop at designated apartment gate.',
    urgency: 'high',
    status: 'pending review'
  },
  {
    id: 'ESC-405',
    ticketId: 'TCK-8072',
    customer: 'Sunil Chetri',
    driver: 'Praveen S (KA-03-3490)',
    category: 'Multiple Failed Pickups',
    amount: '₹220',
    requestedAction: 'Ride Credit Voucher',
    reason: 'App assigned three successive drivers who cancelled consecutively during rain surge.',
    urgency: 'medium',
    status: 'pending review'
  }
];

export function HeadOfSupportDashboard() {
  const [escalations, setEscalations] = useState(MOCK_ESCALATIONS);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [toast, setToast] = useState(null);

  const handleApproveEscalation = (escId) => {
    setEscalations(prev => prev.filter(e => e.id !== escId));
    setSelectedEscalation(null);
    setToast({
      title: 'Escalation Approved',
      message: `Refund & disciplinary action approved for case ${escId}.`,
      type: 'success'
    });
  };

  const handleRejectEscalation = (escId) => {
    setEscalations(prev => prev.filter(e => e.id !== escId));
    setSelectedEscalation(null);
    setToast({
      title: 'Escalation Dismissed',
      message: `Case ${escId} was dismissed back to tier-1 queue with feedback.`,
      type: 'info'
    });
  };

  const agentColumns = [
    { header: 'Agent ID', accessor: 'id', render: r => <span className="font-mono text-xs text-neutral-400">{r.id}</span> },
    { header: 'Support Agent', accessor: 'name', render: r => <span className="font-semibold text-white">{r.name}</span> },
    { header: 'Handled Today', accessor: 'handled', align: 'center' },
    { header: 'Resolved', accessor: 'resolved', align: 'center', render: r => <span className="text-emerald-400 font-semibold">{r.resolved}</span> },
    { header: 'Avg Handle Time', accessor: 'avgTime', align: 'center' },
    { header: 'CSAT Score', accessor: 'csat', align: 'center', render: r => <span className="font-bold text-cyan-400">{r.csat}</span> },
    { header: 'Duty Status', render: r => <StatusPill status={r.status} size="sm" /> }
  ];

  const escalationColumns = [
    { header: 'Escalation ID', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-cyan-400">{r.id}</span> },
    { header: 'Customer', accessor: 'customer', render: r => <span className="font-medium text-white">{r.customer}</span> },
    { header: 'Driver Involved', accessor: 'driver', render: r => <span className="text-xs text-neutral-300">{r.driver}</span> },
    { header: 'Category', accessor: 'category', render: r => <span className="text-xs font-semibold text-rose-300">{r.category}</span> },
    { header: 'Refund Request', accessor: 'amount', render: r => <span className="font-bold text-amber-400">{r.amount}</span> },
    { header: 'Priority', render: r => <StatusPill status={r.urgency} size="sm" /> },
    {
      header: 'Review',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedEscalation(r)}
          className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors font-medium"
        >
          Review Case
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Head of Support Operations
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Support Leadership & Quality Assurance
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Departmental SLA compliance, agent workload distribution, and dispute authorization
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall CSAT"
          value="95.4%"
          subtitle="Target: > 92%"
          icon={Award}
          color="cyan"
          trend="+1.2%"
          trendType="up"
        />
        <MetricCard
          title="Escalated Approvals"
          value={escalations.length}
          subtitle="Requires Director Sign-off"
          icon={AlertOctagon}
          color="rose"
          trend="-2 resolved"
          trendType="up"
        />
        <MetricCard
          title="Team SLA Compliance"
          value="98.1%"
          subtitle="Avg queue wait: 1.8 mins"
          icon={TrendingUp}
          color="emerald"
          trend="+0.6%"
          trendType="up"
        />
        <MetricCard
          title="Active On-Duty Agents"
          value="14"
          subtitle="Across 3 shifts"
          icon={Users}
          color="purple"
          trend="100% staffed"
          trendType="neutral"
        />
      </div>

      {/* Escalated Queue Table */}
      <DataTable
        title="High-Priority Escalations Requiring Approval"
        subtitle="Cases with severe misconduct, dispute refunds exceeding ₹200, or legal inquiry"
        columns={escalationColumns}
        data={escalations}
        searchPlaceholder="Search escalations by passenger, driver or category..."
        searchKeys={['id', 'customer', 'driver', 'category', 'reason']}
      />

      {/* Agent Performance Table */}
      <DataTable
        title="Support Team Roster & Performance"
        subtitle="Individual team member throughput, handle duration, and customer satisfaction ratings"
        columns={agentColumns}
        data={MOCK_AGENTS}
        searchPlaceholder="Filter support agents by name or ID..."
        searchKeys={['name', 'id']}
      />

      {/* Review Modal */}
      {selectedEscalation && (
        <DetailModal
          isOpen={Boolean(selectedEscalation)}
          onClose={() => setSelectedEscalation(null)}
          title={`Supervisor Review: ${selectedEscalation.id}`}
          subtitle={`Ticket Reference: ${selectedEscalation.ticketId} • Action: ${selectedEscalation.requestedAction}`}
          badge={<StatusPill status={selectedEscalation.urgency} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedEscalation(null)}
              >
                Hold
              </QuickActionBtn>
              <QuickActionBtn
                variant="danger"
                icon={X}
                onClick={() => handleRejectEscalation(selectedEscalation.id)}
              >
                Dismiss Case
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={Check}
                onClick={() => handleApproveEscalation(selectedEscalation.id)}
              >
                Authorize Refund & Penalty
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500">Passenger:</span>
                <p className="font-bold text-white mt-0.5">{selectedEscalation.customer}</p>
              </div>
              <div>
                <span className="text-neutral-500">Driver & Vehicle:</span>
                <p className="font-bold text-amber-400 mt-0.5">{selectedEscalation.driver}</p>
              </div>
              <div>
                <span className="text-neutral-500">Requested Refund Amount:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">{selectedEscalation.amount}</p>
              </div>
              <div>
                <span className="text-neutral-500">Incident Category:</span>
                <p className="font-bold text-rose-400 mt-0.5">{selectedEscalation.category}</p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Investigator Briefing & Notes
              </h5>
              <p className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-300 text-xs leading-relaxed">
                {selectedEscalation.reason}
              </p>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Toast */}
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
