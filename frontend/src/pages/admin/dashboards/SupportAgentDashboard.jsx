import React, { useState } from 'react';
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
  Send
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_TICKETS = [
  {
    id: 'TCK-8091',
    user: 'Pooja Hegde',
    userType: 'Customer',
    phone: '+91 98845 22109',
    rideId: 'RD-9021',
    category: 'Fare Dispute',
    subject: 'Driver took longer route and charged extra wait time',
    priority: 'high',
    status: 'open',
    time: '8 mins ago',
    details: 'Customer was billed ₹340 instead of quoted ₹210 due to unnecessary detour through Outer Ring Road.'
  },
  {
    id: 'TCK-8089',
    user: 'Ramesh Babu',
    userType: 'Rider',
    phone: '+91 97711 00234',
    rideId: 'RD-9018',
    category: 'Payment Issue',
    subject: 'Cash payment marked unpaid by customer in app',
    priority: 'high',
    status: 'in progress',
    time: '24 mins ago',
    details: 'Driver collected ₹150 in cash but customer claimed UPI payment failed. Driver requesting credit adjustment.'
  },
  {
    id: 'TCK-8077',
    user: 'Ananya Roy',
    userType: 'Customer',
    phone: '+91 94432 88712',
    rideId: 'RD-8994',
    category: 'Lost & Found',
    subject: 'Left wireless earphones in white Honda Activa',
    priority: 'medium',
    status: 'open',
    time: '1 hour ago',
    details: 'Customer left silver Sony WF-1000XM4 on vehicle seat. Driver phone unreachable.'
  },
  {
    id: 'TCK-8064',
    user: 'Suresh Kumar',
    userType: 'Rider',
    phone: '+91 98801 33419',
    rideId: 'RD-8950',
    category: 'App Crash',
    subject: 'Cannot end trip near Electronic City toll gate',
    priority: 'low',
    status: 'resolved',
    time: '3 hours ago',
    details: 'GPS sync failure. Trip was manually finalized with meter distance 14.2 km.'
  }
];

export function SupportAgentDashboard() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleResolve = (ticketId) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    setSelectedTicket(null);
    setToast({
      title: 'Ticket Resolved',
      message: `Ticket ${ticketId} marked as resolved and customer notified.`,
      type: 'success'
    });
  };

  const handleEscalate = (ticketId) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'escalated' } : t))
    );
    setSelectedTicket(null);
    setToast({
      title: 'Escalated to Head of Support',
      message: `Ticket ${ticketId} forwarded to supervisor queue for high-priority review.`,
      type: 'warning'
    });
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
          status={row.priority === 'high' ? 'High Priority' : row.priority}
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
      header: 'Actions',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedTicket(row)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-emerald-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium"
        >
          Inspect
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Support Agent Portal
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Customer & Rider Support Desk
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Handle customer disputes, SOS incident tickets, and driver live inquiries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Queue Status: <span className="font-semibold text-white">Live Handling</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Open Tickets"
          value={tickets.filter(t => t.status === 'open').length}
          subtitle="Awaiting response"
          icon={Headphones}
          color="emerald"
          trend="+3 new"
          trendType="neutral"
        />
        <MetricCard
          title="Urgent Escalations"
          value="2"
          subtitle="Requires supervisor"
          icon={AlertTriangle}
          color="rose"
          trend="-1 cleared"
          trendType="up"
        />
        <MetricCard
          title="Avg First Response"
          value="2.4m"
          subtitle="Target: under 5 mins"
          icon={Clock}
          color="cyan"
          trend="30s faster"
          trendType="up"
        />
        <MetricCard
          title="Resolved Today"
          value="28"
          subtitle="94% CSAT rating"
          icon={CheckCircle2}
          color="blue"
          trend="+18%"
          trendType="up"
        />
      </div>

      {/* SOS Alert Banner */}
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              SOS Monitor: 0 Active Emergencies
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                All Safe
              </span>
            </h4>
            <p className="text-xs text-neutral-400">
              Live monitoring enabled for Bangalore, Hyderabad & Pune transit corridors.
            </p>
          </div>
        </div>
        <button className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-xl border border-rose-500/30 font-semibold transition-colors">
          View Emergency Feed
        </button>
      </div>

      {/* Main Ticket Queue Table */}
      <DataTable
        title="Support Queue"
        subtitle="Live passenger and driver inquiries ranked by urgency"
        columns={columns}
        data={tickets}
        searchPlaceholder="Search by user, ticket ID or keyword..."
        searchKeys={['id', 'user', 'category', 'subject', 'phone']}
        filterKey="status"
        filterOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Resolved', value: 'resolved' }
        ]}
      />

      {/* Detail / Action Modal */}
      {selectedTicket && (
        <DetailModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.id}`}
          subtitle={`Submitted by ${selectedTicket.user} (${selectedTicket.userType}) • ${selectedTicket.time}`}
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
                variant="danger"
                icon={AlertTriangle}
                onClick={() => handleEscalate(selectedTicket.id)}
              >
                Escalate to Head
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={CheckCircle2}
                onClick={() => handleResolve(selectedTicket.id)}
              >
                Resolve & Close Ticket
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500">Contact Number:</span>
                <p className="font-semibold text-white mt-0.5">{selectedTicket.phone}</p>
              </div>
              <div>
                <span className="text-neutral-500">Associated Ride ID:</span>
                <p className="font-semibold text-emerald-400 mt-0.5">{selectedTicket.rideId || 'None'}</p>
              </div>
              <div>
                <span className="text-neutral-500">Category:</span>
                <p className="font-semibold text-white mt-0.5">{selectedTicket.category}</p>
              </div>
              <div>
                <span className="text-neutral-500">Priority Level:</span>
                <p className="font-semibold text-rose-400 uppercase mt-0.5">{selectedTicket.priority}</p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Issue Description
              </h5>
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-300 text-xs leading-relaxed">
                <p className="font-semibold text-white mb-1">{selectedTicket.subject}</p>
                {selectedTicket.details}
              </div>
            </div>

            {/* Quick Response Box */}
            <div>
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Send Direct Message / Resolution Note
              </h5>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type resolution message to passenger..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (replyText.trim()) {
                      setToast({
                        title: 'Reply Sent',
                        message: `Message sent to ${selectedTicket.user}.`,
                        type: 'info'
                      });
                      setReplyText('');
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Floating Notification Toast */}
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
