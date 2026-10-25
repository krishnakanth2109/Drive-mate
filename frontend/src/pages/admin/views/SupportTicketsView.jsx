import React, { useState } from 'react';
import { 
  Headphones, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  User, 
  Car, 
  Eye, 
  Send 
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const ALL_TICKETS = [
  { id: 'TCK-8091', user: 'Pooja Hegde', userType: 'Customer', phone: '+91 98845 22109', rideId: 'RD-9021', category: 'Fare Dispute', subject: 'Driver took longer route and charged extra wait time', priority: 'high', status: 'open', date: '25 Oct 2026, 11:20 AM' },
  { id: 'TCK-8089', user: 'Ramesh Babu', userType: 'Rider', phone: '+91 97711 00234', rideId: 'RD-9018', category: 'Payment Issue', subject: 'Cash payment marked unpaid by customer in app', priority: 'high', status: 'in progress', date: '25 Oct 2026, 10:45 AM' },
  { id: 'TCK-8077', user: 'Ananya Roy', userType: 'Customer', phone: '+91 94432 88712', rideId: 'RD-8994', category: 'Lost & Found', subject: 'Left wireless earphones in white Honda Activa', priority: 'medium', status: 'open', date: '25 Oct 2026, 09:30 AM' },
  { id: 'TCK-8064', user: 'Suresh Kumar', userType: 'Rider', phone: '+91 98801 33419', rideId: 'RD-8950', category: 'App Crash', subject: 'Cannot end trip near Electronic City toll gate', priority: 'low', status: 'resolved', date: '25 Oct 2026, 08:15 AM' },
  { id: 'TCK-8051', user: 'Vikram Joshi', userType: 'Customer', phone: '+91 91122 33445', rideId: 'RD-8912', category: 'Vehicle Cleanliness', subject: 'Vehicle seat was wet and dirty during rainy pickup', priority: 'low', status: 'resolved', date: '24 Oct 2026, 06:40 PM' },
];

export function SupportTicketsView() {
  const [tickets, setTickets] = useState(ALL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);

  const handleResolve = (ticketId) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    setSelectedTicket(null);
    setToast({
      title: 'Ticket Marked Resolved',
      message: `Ticket ${ticketId} resolved and customer notified.`,
      type: 'success'
    });
  };

  const columns = [
    { header: 'Ticket ID', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-emerald-400">{r.id}</span> },
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
    { header: 'Ride ID', accessor: 'rideId', render: r => <span className="font-mono text-xs text-neutral-300">{r.rideId}</span> },
    {
      header: 'Category & Issue',
      render: r => (
        <div>
          <div className="text-xs font-semibold text-white">{r.category}</div>
          <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">{r.subject}</p>
        </div>
      )
    },
    { header: 'Priority', render: r => <StatusPill status={r.priority} size="sm" /> },
    { header: 'Status', render: r => <StatusPill status={r.status} size="sm" /> },
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Support Tickets & Passenger Claims
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Complete incident queue, fare adjustments, lost & found logs, and safety complaints
        </p>
      </div>

      <DataTable
        title="All Tickets Ledger"
        subtitle="Filter tickets across priority tiers, resolution states and categories"
        columns={columns}
        data={tickets}
        searchPlaceholder="Search tickets by ID, passenger, phone or issue..."
        searchKeys={['id', 'user', 'phone', 'category', 'subject', 'rideId']}
        filterKey="status"
        filterOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Resolved', value: 'resolved' }
        ]}
      />

      {selectedTicket && (
        <DetailModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket Detail: ${selectedTicket.id}`}
          subtitle={`${selectedTicket.category} • Submitted by ${selectedTicket.user} on ${selectedTicket.date}`}
          badge={<StatusPill status={selectedTicket.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn variant="outline" onClick={() => setSelectedTicket(null)}>
                Close
              </QuickActionBtn>
              <QuickActionBtn variant="primary" icon={CheckCircle2} onClick={() => handleResolve(selectedTicket.id)}>
                Resolve Ticket
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Contact:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedTicket.phone}</p>
              </div>
              <div>
                <span className="text-neutral-500">Ride Reference:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">{selectedTicket.rideId}</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Statement of Claim</span>
              <p className="text-white text-xs mt-1 leading-relaxed font-semibold">{selectedTicket.subject}</p>
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
