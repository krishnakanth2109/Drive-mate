import React, { useState } from 'react';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Building2, 
  Eye, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

const MOCK_TRANSACTIONS = [
  { id: 'TXN-8801', user: 'Krishna Kanth', userType: 'Customer', type: 'credit', amount: 500.00, currency: 'INR', description: 'Wallet top-up via UPI Razorpay', referenceId: 'pay_Oa912Kks81', date: '25 Oct 2026, 11:05 AM', status: 'completed' },
  { id: 'TXN-8802', user: 'Pooja Hegde', userType: 'Customer', type: 'debit', amount: 142.50, currency: 'INR', description: 'Ride payment: RD-9021', referenceId: 'RD-9021', date: '25 Oct 2026, 10:48 AM', status: 'completed' },
  { id: 'TXN-8803', user: 'Suresh Kumar', userType: 'Rider', type: 'credit', amount: 114.00, currency: 'INR', description: 'Driver earnings payout: RD-9021 (80%)', referenceId: 'RD-9021', date: '25 Oct 2026, 10:48 AM', status: 'completed' },
  { id: 'TXN-8804', user: 'Manjunath Reddy', userType: 'Rider', type: 'debit', amount: 3000.00, currency: 'INR', description: 'Bank Payout withdrawal to HDFC Bank', referenceId: 'PAY-902', date: '25 Oct 2026, 09:12 AM', status: 'completed' },
  { id: 'TXN-8805', user: 'Ananya Roy', userType: 'Customer', type: 'credit', amount: 200.00, currency: 'INR', description: 'Dispute refund credited by Support', referenceId: 'TCK-8091', date: '24 Oct 2026, 05:30 PM', status: 'completed' },
];

export function FinancePayoutsView() {
  const [transactions] = useState(MOCK_TRANSACTIONS);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const columns = [
    { header: 'Transaction ID', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-teal-400">{r.id}</span> },
    {
      header: 'Account / User',
      render: r => (
        <div>
          <div className="font-semibold text-white">{r.user}</div>
          <div className="text-xs text-neutral-400">{r.userType}</div>
        </div>
      )
    },
    {
      header: 'Flow Type',
      render: r => (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
          r.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {r.type === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
          {r.type.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Amount',
      render: r => (
        <span className={`font-extrabold text-sm ${r.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
          {r.type === 'credit' ? '+' : '-'}₹{r.amount.toFixed(2)}
        </span>
      )
    },
    { header: 'Description', accessor: 'description', className: 'text-neutral-300 text-xs' },
    { header: 'Reference', accessor: 'referenceId', render: r => <span className="font-mono text-xs text-neutral-400">{r.referenceId || 'N/A'}</span> },
    { header: 'Timestamp', accessor: 'date', className: 'text-neutral-400 text-xs' },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedTxn(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-teal-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Receipt
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Financial Ledger & Payouts Log
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Complete record of ride debits, driver commissions, and wallet top-ups
          </p>
        </div>
      </div>

      <DataTable
        title="Transactions Ledger"
        subtitle="All credits and debits posted to user & driver accounts"
        columns={columns}
        data={transactions}
        searchPlaceholder="Search transactions by ID, user, reference, or description..."
        searchKeys={['id', 'user', 'description', 'referenceId']}
        filterKey="type"
        filterOptions={[
          { label: 'All Transfers', value: 'all' },
          { label: 'Credits (+)', value: 'credit' },
          { label: 'Debits (-)', value: 'debit' }
        ]}
      />

      {selectedTxn && (
        <DetailModal
          isOpen={Boolean(selectedTxn)}
          onClose={() => setSelectedTxn(null)}
          title={`Receipt: ${selectedTxn.id}`}
          subtitle={`${selectedTxn.date} • Reference: ${selectedTxn.referenceId}`}
          badge={<StatusPill status={selectedTxn.status} size="sm" />}
          actions={
            <QuickActionBtn variant="secondary" onClick={() => setSelectedTxn(null)}>
              Close
            </QuickActionBtn>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Party Account:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedTxn.user}</p>
                <p className="text-neutral-400">{selectedTxn.userType}</p>
              </div>
              <div>
                <span className="text-neutral-500">Transaction Amount:</span>
                <p className="font-extrabold text-emerald-400 text-lg mt-0.5">₹{selectedTxn.amount.toFixed(2)}</p>
                <p className="text-neutral-400 uppercase font-semibold text-[10px]">{selectedTxn.currency} Currency</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Narration / Memo</span>
              <p className="text-white text-xs mt-1 leading-relaxed">{selectedTxn.description}</p>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
