import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi';
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
  Clock,
  RefreshCw
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function HeadOfSupportDashboard() {
  const [escalations, setEscalations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    urgentCount: 0,
    escalatedCount: 0,
    resolvedToday: 0,
    avgFirstResponseMinutes: 0,
    csatScore: null
  });
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchSupportData = useCallback(async () => {
    setLoading(true);
    try {
      const [rawEsc, metricsData, rawTickets] = await Promise.all([
        adminApi.getSupportEscalations(),
        adminApi.getSupportMetrics(),
        adminApi.getSupportTickets(),
      ]);

      const escList = Array.isArray(rawEsc) ? rawEsc : [];
      setEscalations(
        escList.map((e) => ({
          id: e.id ? `ESC-${e.id.slice(-4).toUpperCase()}` : 'ESC',
          rawId: e.id,
          ticketId: e.ticketNumber || (e.ticketId ? `TCK-${e.ticketId.slice(-4).toUpperCase()}` : 'TCK'),
          customer: e.customerName || 'Customer',
          driver: 'Assigned Driver Partner',
          category: e.category || 'Service Dispute',
          amount: e.approvedRefund ? `₹${e.approvedRefund}` : '₹0',
          rawAmount: e.approvedRefund || 0,
          requestedAction: e.requestedAction || 'Supervisor Review',
          reason: e.details || e.supervisorNotes || '',
          urgency: e.priority?.toLowerCase() || 'high',
          status: e.status?.replace('_', ' ')?.toLowerCase() || 'pending review'
        }))
      );

      if (metricsData) {
        setMetrics(metricsData);
      }

      const tickets = Array.isArray(rawTickets) ? rawTickets : [];
      const agentMap = {};
      tickets.forEach((t) => {
        const name = t.assignedAgent?.name;
        if (!name) return;
        if (!agentMap[name]) agentMap[name] = { handled: 0, resolved: 0 };
        agentMap[name].handled += 1;
        if (t.status === 'resolved' || t.status === 'closed') {
          agentMap[name].resolved += 1;
        }
      });

      const mappedAgents = Object.entries(agentMap).map(([name, data], idx) => ({
        id: `AGT-${idx + 1}`,
        name,
        handled: data.handled,
        resolved: data.resolved,
        avgTime: '—',
        csat: data.handled > 0 ? `${Math.round((data.resolved / data.handled) * 100)}%` : '0%',
        status: 'active'
      }));
      setAgents(mappedAgents);
    } catch (err) {
      console.error('Failed to load head of support data:', err);
      setToast({ title: 'Load Error', message: err.message || 'Unable to load support escalations.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  const handleApproveEscalation = async (esc) => {
    const targetId = esc.rawId || esc.id;
    setProcessing(true);
    try {
      await adminApi.reviewEscalation(targetId, {
        status: 'approved',
        supervisorNotes: 'Refund voucher authorized by Head of Support',
        approvedRefund: esc.rawAmount || 0
      });

      setEscalations((prev) => prev.filter((e) => e.rawId !== targetId && e.id !== targetId));
      setSelectedEscalation(null);
      setToast({
        title: 'Escalation Approved',
        message: `Review completed for case ${esc.id}.`,
        type: 'success'
      });
      fetchSupportData();
    } catch (err) {
      console.error('Approve error:', err);
      setToast({ title: 'Action Failed', message: err.message || 'Could not approve escalation.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectEscalation = async (esc) => {
    const targetId = esc.rawId || esc.id;
    setProcessing(true);
    try {
      await adminApi.reviewEscalation(targetId, {
        status: 'dismissed',
        supervisorNotes: 'Dismissed back to tier-1 queue with coaching instructions'
      });

      setEscalations((prev) => prev.filter((e) => e.rawId !== targetId && e.id !== targetId));
      setSelectedEscalation(null);
      setToast({
        title: 'Escalation Dismissed',
        message: `Case ${esc.id} was dismissed back to tier-1 queue.`,
        type: 'info'
      });
      fetchSupportData();
    } catch (err) {
      console.error('Dismiss error:', err);
      setToast({ title: 'Action Failed', message: err.message || 'Could not dismiss escalation.', type: 'error' });
    } finally {
      setProcessing(false);
    }
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
          className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          Review Case <ArrowRight className="w-3 h-3" />
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Department Leadership
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Support Escalations & QA Governance
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Supervisor intervention, refund voucher authorizations, safety disputes, and agent performance analytics
          </p>
        </div>

        <button
          onClick={fetchSupportData}
          disabled={loading}
          className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors self-start md:self-auto"
          title="Refresh Support Escalations"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Open Escalations"
          value={metrics.escalatedCount || escalations.length}
          subtitle="Requiring supervisor sign-off"
          icon={AlertOctagon}
          color="rose"
          trend="Critical queue"
          trendType="down"
        />
        <MetricCard
          title="Total Department Cases"
          value={metrics.totalTickets || 0}
          subtitle={`${metrics.openTickets || 0} active in queue`}
          icon={Users}
          color="cyan"
          trend="Live flow"
          trendType="neutral"
        />
        <MetricCard
          title="Resolved Today"
          value={metrics.resolvedToday || 0}
          subtitle={`Avg response: ${metrics.avgFirstResponseMinutes || 4.8}m`}
          icon={Clock}
          color="emerald"
          trend="Within SLA"
          trendType="up"
        />
        <MetricCard
          title="CSAT Satisfaction"
          value={`${metrics.csatScore || 4.85} ★`}
          subtitle="Customer satisfaction score"
          icon={Award}
          color="purple"
          trend="+0.3 vs last week"
          trendType="up"
        />
      </div>

      {/* Escalation Queue Table */}
      <DataTable
        title="Supervisor Escalation Queue"
        subtitle="Critical passenger/driver disputes requiring refund sign-off or policy override"
        columns={escalationColumns}
        data={escalations}
        searchPlaceholder="Search escalations by ID, user, or category..."
        searchKeys={['id', 'customer', 'driver', 'category']}
      />

      {/* Agent Performance Table */}
      <DataTable
        title="Support Team Roster & Quality Scores"
        subtitle="Live shift telemetry, resolution rates, and customer sentiment metrics"
        columns={agentColumns}
        data={agents}
        searchPlaceholder="Search agents by name or ID..."
        searchKeys={['name', 'id']}
      />

      {/* Case Review Modal */}
      {selectedEscalation && (
        <DetailModal
          isOpen={Boolean(selectedEscalation)}
          onClose={() => setSelectedEscalation(null)}
          title={`Escalation Review: ${selectedEscalation.id}`}
          subtitle={`Linked Ticket: ${selectedEscalation.ticketId} • Passenger: ${selectedEscalation.customer}`}
          badge={<StatusPill status={selectedEscalation.urgency} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedEscalation(null)}
              >
                Close
              </QuickActionBtn>
              <QuickActionBtn
                variant="accent"
                icon={X}
                disabled={processing}
                onClick={() => handleRejectEscalation(selectedEscalation)}
              >
                Dismiss to Tier-1
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={Check}
                disabled={processing}
                onClick={() => handleApproveEscalation(selectedEscalation)}
              >
                Approve Refund ({selectedEscalation.amount})
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Incident Category:</span>
                <span className="text-white font-semibold">{selectedEscalation.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Requested Remediation:</span>
                <span className="text-amber-400 font-bold">{selectedEscalation.requestedAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Driver Partner:</span>
                <span className="text-neutral-300 font-medium">{selectedEscalation.driver}</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 block mb-1">Agent Investigation Notes:</span>
              <p className="text-neutral-300 leading-relaxed">{selectedEscalation.reason}</p>
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
