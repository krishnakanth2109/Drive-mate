import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { 
  Headphones, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  User, 
  Car, 
  Eye, 
  Send,
  RefreshCw 
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function SupportTicketsView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSupportTickets();
      const formatted = (Array.isArray(data) ? data : []).map((t) => ({
        ...t,
        id: t.ticketNumber || t.id || t._id,
        rawId: t.id || t._id,
        user: t.userName || t.user || 'User',
        phone: t.userPhone || t.phone || 'N/A',
        rideId: t.rideId || 'N/A',
        date: t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
      }));
      setTickets(formatted);
    } catch (err) {
      console.error('Failed to fetch tickets from backend:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolve = async (ticketId) => {
    try {
      await adminApi.updateSupportTicket(ticketId, { status: 'resolved' });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.rawId === ticketId || t._id === ticketId ? { ...t, status: 'resolved' } : t))
      );
      setSelectedTicket(null);
      setToast({
        title: 'Ticket Marked Resolved',
        message: `Ticket ${ticketId} resolved and customer notified.`,
        type: 'success'
      });
    } catch (e) {
      setToast({
        title: 'Resolution Failed',
        message: e.message || 'Could not update ticket on server.',
        type: 'error'
      });
    }
  };

  const columns = [
    { 
      header: 'Ticket ID', 
      accessor: 'id', 
      render: r => <span className="font-mono text-xs font-bold text-emerald-400">{r.id}</span> 
    },
    {
      header: 'Complainant',
      render: r => (
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            {r.userType === 'Rider' ? <Car className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-blue-400" />}
            {r.user}
          </div>
          <div className="text-xs text-neutral-400">{r.phone}</div>
        </div>
      )
    },
    { 
      header: 'Ride ID', 
      accessor: 'rideId', 
      render: r => <span className="font-mono text-xs text-neutral-300">#{r.rideId}</span> 
    },
    {
      header: 'Category & Issue',
      render: r => (
        <div>
          <div className="text-xs font-semibold text-white">{r.category}</div>
          <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">{r.subject || r.details}</p>
        </div>
      )
    },
    { header: 'Priority', render: r => <StatusPill status={r.priority || 'medium'} size="sm" /> },
    { header: 'Status', render: r => <StatusPill status={r.status || 'open'} size="sm" /> },
    { header: 'Created', accessor: 'date', className: 'text-neutral-400 text-xs' },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedTicket(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-emerald-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Inspect
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
            Support Tickets & Passenger Claims
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Complete incident queue, fare adjustments, lost & found logs, and safety complaints
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Tickets
        </button>
      </div>

      <DataTable
        title="All Tickets Ledger"
        subtitle="Live support cases fetched directly from database queue"
        columns={columns}
        data={tickets}
        loading={loading}
        searchPlaceholder="Search tickets by ID, passenger, phone or issue..."
        searchKeys={['id', 'user', 'phone', 'category', 'subject', 'rideId']}
      />

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <DetailModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket #${selectedTicket.id}`}
          subtitle={`${selectedTicket.category} • Filed on ${selectedTicket.date}`}
          badge={<StatusPill status={selectedTicket.status} size="sm" />}
          actions={
            <div className="flex gap-2">
              {selectedTicket.status !== 'resolved' && (
                <QuickActionBtn
                  variant="success"
                  onClick={() => handleResolve(selectedTicket.id)}
                >
                  Mark Resolved
                </QuickActionBtn>
              )}
              <QuickActionBtn variant="secondary" onClick={() => setSelectedTicket(null)}>
                Close
              </QuickActionBtn>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 font-medium">Complainant:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedTicket.user}</p>
                <p className="text-neutral-400">{selectedTicket.phone} ({selectedTicket.userType})</p>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Linked Ride ID:</span>
                <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">#{selectedTicket.rideId}</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-500 font-medium">Issue Description:</span>
              <p className="text-white font-medium text-sm pt-1 leading-relaxed">{selectedTicket.subject}</p>
              {selectedTicket.details && selectedTicket.details !== selectedTicket.subject && (
                <p className="text-neutral-300 text-xs pt-2 border-t border-neutral-900 leading-relaxed">
                  {selectedTicket.details}
                </p>
              )}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
