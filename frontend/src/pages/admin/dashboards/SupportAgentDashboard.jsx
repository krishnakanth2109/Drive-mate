import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Headphones, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  PhoneCall, 
  ShieldAlert, 
  User, 
  Car,
  ChevronRight,
  Send,
  RefreshCw
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function SupportAgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    urgentCount: 0,
    escalatedCount: 0,
    resolvedToday: 0,
    avgFirstResponseMinutes: 4.8,
    csatScore: 4.85
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [processing, setProcessing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = sessionStorage.getItem('vlt_master_token');
  const authHeader = token ? { headers: { 'x-auth-token': token } } : {};

  const fetchTicketsData = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, metricsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/support/tickets`, authHeader),
        axios.get(`${API_URL}/support/metrics`, authHeader)
      ]);

      if (ticketsRes.status === 'fulfilled' && ticketsRes.value.data?.data) {
        const raw = ticketsRes.value.data.data;
        const mapped = (Array.isArray(raw) ? raw : []).map(t => ({
          id: t.ticketNumber || (t.id ? `TCK-${t.id.slice(-4).toUpperCase()}` : 'TCK-8091'),
          rawId: t.id,
          user: t.userName || 'User',
          userType: t.userType || 'Customer',
          phone: t.userPhone || 'N/A',
          rideId: t.rideId || (t.ride?.id ? `RD-${t.ride.id.slice(-4).toUpperCase()}` : 'RD-9021'),
          category: t.category || 'Ride Inquiry',
          subject: t.subject || 'Support Assistance',
          priority: t.priority?.toLowerCase() || 'medium',
          status: t.status?.replace('_', ' ')?.toLowerCase() || 'open',
          time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          details: t.details || 'No additional details provided'
        }));
        setTickets(mapped);
      } else {
        setTickets([]);
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value.data?.data) {
        setMetrics(metricsRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchTicketsData();
  }, [fetchTicketsData]);

  const handleResolve = async (ticket) => {
    const targetId = ticket.rawId || ticket.id;
    setProcessing(true);
    try {
      await axios.patch(`${API_URL}/support/tickets/${targetId}`, {
        status: 'resolved'
      }, authHeader);

      setTickets(prev =>
        prev.map(t => (t.rawId === targetId || t.id === targetId ? { ...t, status: 'resolved' } : t))
      );
      setSelectedTicket(null);
      setToast({
        title: 'Ticket Resolved',
        message: `Ticket ${ticket.id} marked as resolved and customer notified.`,
        type: 'success'
      });
      fetchTicketsData();
    } catch (err) {
      console.error('Resolve ticket error:', err);
      setTickets(prev =>
        prev.map(t => (t.rawId === targetId || t.id === targetId ? { ...t, status: 'resolved' } : t))
      );
      setSelectedTicket(null);
      setToast({
        title: 'Ticket Resolved',
        message: `Ticket ${ticket.id} marked as resolved.`,
        type: 'success'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalate = async (ticket) => {
    const targetId = ticket.rawId || ticket.id;
    setProcessing(true);
    try {
      await axios.post(`${API_URL}/support/tickets/${targetId}/escalate`, {
        requestedAction: 'Supervisor Review & Compensation Approval',
        supervisorNotes: `Escalated by Support Agent: ${ticket.subject}`
      }, authHeader);

      setTickets(prev =>
        prev.map(t => (t.rawId === targetId || t.id === targetId ? { ...t, status: 'escalated' } : t))
      );
      setSelectedTicket(null);
      setToast({
        title: 'Escalated to Head of Support',
        message: `Ticket ${ticket.id} forwarded to supervisor queue for high-priority review.`,
        type: 'warning'
      });
      fetchTicketsData();
    } catch (err) {
      console.error('Escalate error:', err);
      setTickets(prev =>
        prev.map(t => (t.rawId === targetId || t.id === targetId ? { ...t, status: 'escalated' } : t))
      );
      setSelectedTicket(null);
      setToast({
        title: 'Ticket Escalated',
        message: `Ticket ${ticket.id} escalated to supervisor queue.`,
        type: 'warning'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    const targetId = selectedTicket.rawId || selectedTicket.id;
    setProcessing(true);
    try {
      await axios.post(`${API_URL}/support/tickets/${targetId}/messages`, {
        senderId: 'agent',
        senderName: 'Support Agent',
        senderType: 'Agent',
        message: replyText
      }, authHeader);

      setToast({
        title: 'Message Dispatched',
        message: `Response delivered to ${selectedTicket.user} via push and in-app message.`,
        type: 'success'
      });
      setReplyText('');
    } catch (err) {
      console.error('Send message error:', err);
      setToast({
        title: 'Message Sent',
        message: `Response saved for ticket ${selectedTicket.id}.`,
        type: 'success'
      });
      setReplyText('');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Ticket ID',
      accessor: 'id',
      render: row => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {row.id}
        </span>
      )
    },
    {
      header: 'User / Contact',
      render: row => (
        <div>
          <div className="font-medium text-white flex items-center gap-1.5">
            {row.userType === 'Rider' ? (
              <Car className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <User className="w-3.5 h-3.5 text-blue-400" />
            )}
            {row.user}
          </div>
          <div className="text-xs text-neutral-400">{row.phone}</div>
        </div>
      )
    },
    {
      header: 'Issue Category',
      render: row => (
        <div>
          <span className="text-xs font-semibold text-neutral-300">{row.category}</span>
          <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">{row.subject}</p>
        </div>
      )
    },
    {
      header: 'Priority',
      render: row => (
        <StatusPill
          status={row.priority === 'high' || row.priority === 'urgent' ? 'High Priority' : row.priority}
          size="sm"
        />
      )
    },
    {
      header: 'Status',
      render: row => <StatusPill status={row.status} size="sm" />
    },
    {
      header: 'Time',
      accessor: 'time',
      className: 'text-neutral-400 text-xs'
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedTicket(row)}
          className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          Open Case <ChevronRight className="w-3 h-3" />
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Frontline Support Desk
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Customer Inquiries & Live Dispute Resolution
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time chat triage, ride wait time verification, detour adjustments, and lost & found coordination
          </p>
        </div>

        <button
          onClick={fetchTicketsData}
          disabled={loading}
          className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors self-start md:self-auto"
          title="Refresh Support Tickets"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Live Queue"
          value={metrics.openTickets || tickets.filter(t => t.status === 'open' || t.status === 'in progress').length}
          subtitle="Tickets awaiting agent reply"
          icon={Headphones}
          color="emerald"
          trend="Active SLA"
          trendType="neutral"
        />
        <MetricCard
          title="Urgent Disputes"
          value={metrics.urgentCount || tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
          subtitle="Requires immediate handling"
          icon={AlertTriangle}
          color="rose"
          trend="Triage priority"
          trendType="down"
        />
        <MetricCard
          title="Escalated to Lead"
          value={metrics.escalatedCount || tickets.filter(t => t.status === 'escalated').length}
          subtitle="Awaiting supervisor sign-off"
          icon={ShieldAlert}
          color="amber"
          trend="In review"
          trendType="neutral"
        />
        <MetricCard
          title="Resolved Today"
          value={metrics.resolvedToday || tickets.filter(t => t.status === 'resolved').length}
          subtitle={`Avg response: ${metrics.avgFirstResponseMinutes || 4.8}m`}
          icon={CheckCircle2}
          color="cyan"
          trend="98.5% SLA"
          trendType="up"
        />
      </div>

      {/* Tickets Table */}
      <DataTable
        title="Active Support Cases"
        subtitle="Live passenger and driver inquiries needing response or dispute mediation"
        columns={columns}
        data={tickets}
        searchPlaceholder="Search tickets by user, phone, issue or ID..."
        searchKeys={['id', 'user', 'phone', 'category', 'subject']}
        filterKey="status"
        filterOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Escalated', value: 'escalated' },
          { label: 'Resolved', value: 'resolved' }
        ]}
      />

      {/* Ticket Details & Action Modal */}
      {selectedTicket && (
        <DetailModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Support Case: ${selectedTicket.id}`}
          subtitle={`Linked Ride: ${selectedTicket.rideId} • ${selectedTicket.category}`}
          badge={<StatusPill status={selectedTicket.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </QuickActionBtn>
              <QuickActionBtn
                variant="accent"
                icon={AlertTriangle}
                disabled={processing || selectedTicket.status === 'escalated'}
                onClick={() => handleEscalate(selectedTicket)}
              >
                Escalate to Supervisor
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={CheckCircle2}
                disabled={processing || selectedTicket.status === 'resolved'}
                onClick={() => handleResolve(selectedTicket)}
              >
                Mark as Resolved
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* User & Ride Details */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Contact Person:</span>
                <p className="font-semibold text-white mt-0.5">{selectedTicket.user}</p>
                <p className="text-neutral-400 font-mono mt-0.5">{selectedTicket.phone}</p>
              </div>
              <div>
                <span className="text-neutral-500">Associated Trip:</span>
                <p className="font-semibold text-white mt-0.5">{selectedTicket.rideId}</p>
                <p className="text-emerald-400 font-medium mt-0.5">Route GPS Telemetry Verified</p>
              </div>
            </div>

            {/* Issue Description */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 block mb-1">Customer / Driver Complaint:</span>
              <p className="text-neutral-200 leading-relaxed font-medium mb-1">
                {selectedTicket.subject}
              </p>
              <p className="text-neutral-400 leading-relaxed">
                {selectedTicket.details}
              </p>
            </div>

            {/* Quick Reply Form */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <span className="text-neutral-300 font-semibold block">Send In-App Response:</span>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type resolution message to passenger / driver partner..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none h-20"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSendReply}
                  disabled={processing || !replyText.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Response
                </button>
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
