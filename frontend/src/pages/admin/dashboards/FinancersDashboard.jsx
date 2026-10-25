import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCw, 
  Check, 
  X, 
  Building2, 
  Wallet,
  Clock,
  Send
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_PAYOUTS = [
  { id: 'PAY-901', driver: 'Suresh Kumar', phone: '+91 98801 33419', amount: '₹3,450', bank: 'State Bank of India', ifsc: 'SBIN0001234', accNumber: '••••••••4812', requestedAt: '15 mins ago', status: 'pending' },
  { id: 'PAY-902', driver: 'Manjunath Reddy', phone: '+91 97412 88901', amount: '₹4,120', bank: 'HDFC Bank', ifsc: 'HDFC0000456', accNumber: '••••••••9031', requestedAt: '45 mins ago', status: 'pending' },
  { id: 'PAY-903', driver: 'Basavaraj Patil', phone: '+91 96112 44321', amount: '₹2,800', bank: 'ICICI Bank', ifsc: 'ICIC0000890', accNumber: '••••••••1122', requestedAt: '2 hours ago', status: 'approved' },
  { id: 'PAY-904', driver: 'Ravi Teja', phone: '+91 94488 12390', amount: '₹1,950', bank: 'Canara Bank', ifsc: 'CNRB0002244', accNumber: '••••••••5567', requestedAt: '3 hours ago', status: 'completed' },
  { id: 'PAY-905', driver: 'Anil Deshmukh', phone: '+91 98822 77109', amount: '₹5,200', bank: 'Axis Bank', ifsc: 'UTIB0001920', accNumber: '••••••••7721', requestedAt: '5 hours ago', status: 'failed' },
];

export function FinancersDashboard() {
  const [payouts, setPayouts] = useState(MOCK_PAYOUTS);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [toast, setToast] = useState(null);

  const handleProcessTransfer = (payoutId) => {
    setPayouts(prev =>
      prev.map(p => (p.id === payoutId ? { ...p, status: 'completed' } : p))
    );
    setSelectedPayout(null);
    setToast({
      title: 'Disbursement Executed',
      message: `IMPS wire transfer initiated for ${payoutId}. Driver wallet balance debited.`,
      type: 'success'
    });
  };

  const handleRetryFailed = (payoutId) => {
    setPayouts(prev =>
      prev.map(p => (p.id === payoutId ? { ...p, status: 'pending' } : p))
    );
    setSelectedPayout(null);
    setToast({
      title: 'Transfer Queued for Retry',
      message: `Transfer ${payoutId} rescheduled with fallback payment gateway node.`,
      type: 'info'
    });
  };

  const columns = [
    { header: 'Payout Ref', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-teal-400">{r.id}</span> },
    {
      header: 'Beneficiary Driver',
      render: r => (
        <div>
          <div className="font-semibold text-white">{r.driver}</div>
          <div className="text-xs text-neutral-400">{r.phone}</div>
        </div>
      )
    },
    {
      header: 'Bank & Account',
      render: r => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-white">{r.bank}</div>
            <div className="text-[11px] text-neutral-400 font-mono">{r.accNumber} ({r.ifsc})</div>
          </div>
        </div>
      )
    },
    {
      header: 'Payout Amount',
      accessor: 'amount',
      render: r => <span className="font-bold text-white text-sm">{r.amount}</span>
    },
    { header: 'Requested', accessor: 'requestedAt', className: 'text-neutral-400 text-xs' },
    { header: 'Status', render: r => <StatusPill status={r.status} size="sm" /> },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedPayout(r)}
          className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30 transition-colors font-medium"
        >
          Execute Transfer
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Disbursements & Operations
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Driver Payout Execution & Wallet Operations
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Daily bank transfers, IMPS rails verification, customer refunds, and wallet reconciliation
          </p>
        </div>

        <QuickActionBtn
          variant="primary"
          icon={Send}
          onClick={() => {
            setToast({
              title: 'Batch Disbursement Triggered',
              message: 'Processed 2 pending transfers totaling ₹7,570 via automated IMPS.',
              type: 'success'
            });
          }}
        >
          Process All Pending
        </QuickActionBtn>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Pending Payout Queue"
          value={payouts.filter(p => p.status === 'pending').length}
          subtitle="Awaiting bank transfer"
          icon={Clock}
          color="teal"
          trend="₹7,570 volume"
          trendType="neutral"
        />
        <MetricCard
          title="Disbursed Today"
          value="₹42,850"
          subtitle="18 successful wires"
          icon={ArrowUpRight}
          color="emerald"
          trend="+12% vs yesterday"
          trendType="up"
        />
        <MetricCard
          title="Refunds Issued"
          value="₹1,240"
          subtitle="4 passenger disputes"
          icon={ArrowDownLeft}
          color="cyan"
          trend="Within SLA"
          trendType="up"
        />
        <MetricCard
          title="Failed Transfer Queue"
          value="1"
          subtitle="IFSC validation error"
          icon={RotateCw}
          color="rose"
          trend="Action required"
          trendType="neutral"
        />
      </div>

      {/* Payout Queue Table */}
      <DataTable
        title="Immediate Bank Transfer Queue"
        subtitle="Individual driver earnings withdrawal requests awaiting IMPS execution"
        columns={columns}
        data={payouts}
        searchPlaceholder="Search by driver, bank or payout ID..."
        searchKeys={['id', 'driver', 'bank', 'phone']}
        filterKey="status"
        filterOptions={[
          { label: 'All Payouts', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' }
        ]}
      />

      {/* Execution Modal */}
      {selectedPayout && (
        <DetailModal
          isOpen={Boolean(selectedPayout)}
          onClose={() => setSelectedPayout(null)}
          title={`Disburse Funds: ${selectedPayout.id}`}
          subtitle={`Beneficiary: ${selectedPayout.driver} • ${selectedPayout.phone}`}
          badge={<StatusPill status={selectedPayout.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedPayout(null)}
              >
                Close
              </QuickActionBtn>
              {selectedPayout.status === 'failed' ? (
                <QuickActionBtn
                  variant="accent"
                  icon={RotateCw}
                  onClick={() => handleRetryFailed(selectedPayout.id)}
                >
                  Retry Failed Wire
                </QuickActionBtn>
              ) : (
                <QuickActionBtn
                  variant="primary"
                  icon={Send}
                  onClick={() => handleProcessTransfer(selectedPayout.id)}
                >
                  Confirm IMPS Transfer ({selectedPayout.amount})
                </QuickActionBtn>
              )}
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Beneficiary Bank:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedPayout.bank}</p>
                <p className="text-neutral-400 font-mono mt-0.5">IFSC: {selectedPayout.ifsc}</p>
              </div>
              <div>
                <span className="text-neutral-500">Account Number:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedPayout.accNumber}</p>
                <p className="text-emerald-400 font-semibold mt-0.5">Name match verified (100%)</p>
              </div>
              <div>
                <span className="text-neutral-500">Withdrawal Amount:</span>
                <p className="font-extrabold text-emerald-400 text-lg mt-0.5">{selectedPayout.amount}</p>
              </div>
              <div>
                <span className="text-neutral-500">Payout Rail:</span>
                <p className="font-bold text-teal-400 text-sm mt-0.5">Immediate Payment Service (IMPS)</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 text-xs leading-relaxed">
              Upon clicking "Confirm IMPS Transfer", the banking API will instantly release funds into the beneficiary bank account. The driver's in-app wallet balance will reflect the completed withdrawal.
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
