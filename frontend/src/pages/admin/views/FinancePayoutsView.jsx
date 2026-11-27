import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Building2, 
  Eye, 
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

export function FinancePayoutsView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFinancialLedger();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Finance ledger endpoint error, trying disbursements:', err);
      try {
        const disbursements = await adminApi.getDisbursements();
        if (Array.isArray(disbursements)) {
          const mapped = disbursements.map((d) => ({
            id: `TXN-${d.id.slice(-6).toUpperCase()}`,
            user: d.driverName || 'Driver Partner',
            userType: 'Rider',
            type: 'debit',
            amount: Number(d.amount),
            currency: 'INR',
            description: `Driver payout to ${d.bankName} (${d.accountNumberMasked})`,
            referenceId: d.payoutRef || d.id,
            date: new Date(d.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            status: d.status?.toLowerCase() || 'pending'
          }));
          setTransactions(mapped);
        } else {
          setTransactions([]);
        }
      } catch {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
          {r.type === 'credit' ? '+' : '-'}₹{typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount}
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

        <button
          onClick={fetchTransactions}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      <DataTable
        title="Transactions Ledger"
        subtitle="Live ledger data fetched from backend PostgreSQL transaction records"
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
