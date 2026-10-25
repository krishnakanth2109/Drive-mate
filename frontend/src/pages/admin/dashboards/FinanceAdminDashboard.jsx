import React, { useState } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const PAYOUT_BATCHES = [
  { batchId: 'BATCH-2026-W42', date: '25 Oct 2026', totalAmount: '₹1,42,850', driverCount: 48, gatewayFee: '₹1,850', status: 'pending authorization', method: 'IMPS Direct Transfer' },
  { batchId: 'BATCH-2026-W41', date: '18 Oct 2026', totalAmount: '₹1,28,400', driverCount: 44, gatewayFee: '₹1,620', status: 'approved', method: 'IMPS Direct Transfer' },
  { batchId: 'BATCH-2026-W40', date: '11 Oct 2026', totalAmount: '₹1,35,920', driverCount: 46, gatewayFee: '₹1,740', status: 'completed', method: 'IMPS Direct Transfer' },
  { batchId: 'BATCH-2026-W39', date: '04 Oct 2026', totalAmount: '₹1,19,200', driverCount: 39, gatewayFee: '₹1,510', status: 'completed', method: 'IMPS Direct Transfer' },
];

export function FinanceAdminDashboard() {
  const [batches, setBatches] = useState(PAYOUT_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [toast, setToast] = useState(null);

  const handleAuthorizeBatch = (batchId) => {
    setBatches(prev =>
      prev.map(b => (b.batchId === batchId ? { ...b, status: 'approved' } : b))
    );
    setSelectedBatch(null);
    setToast({
      title: 'Batch Payout Authorized',
      message: `Batch ${batchId} authorized. Queued for automated bank transfer execution.`,
      type: 'success'
    });
  };

  const columns = [
    {
      header: 'Batch Reference',
      accessor: 'batchId',
      render: r => <span className="font-mono text-xs font-bold text-rose-400">{r.batchId}</span>
    },
    { header: 'Disbursement Date', accessor: 'date', className: 'text-neutral-300 text-xs' },
    {
      header: 'Gross Total',
      accessor: 'totalAmount',
      render: r => <span className="font-bold text-emerald-400 text-sm">{r.totalAmount}</span>
    },
    {
      header: 'Recipient Drivers',
      accessor: 'driverCount',
      align: 'center',
      render: r => <span className="font-semibold text-white">{r.driverCount} Drivers</span>
    },
    { header: 'Gateway Fee', accessor: 'gatewayFee', className: 'text-neutral-400 text-xs' },
    {
      header: 'Batch Status',
      render: r => <StatusPill status={r.status} size="sm" />
    },
    {
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedBatch(r)}
          className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors font-medium"
        >
          Review & Sign
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Finance & Treasury Administration
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Financial Ledger & Payout Authorizations
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Platform GMV, driver revenue disbursement batches, Razorpay reconciliation, and tax audits
          </p>
        </div>

        <QuickActionBtn
          variant="secondary"
          icon={Download}
          onClick={() => {
            setToast({
              title: 'GST & Financial Audit Exported',
              message: 'Tax ledger CSV downloaded successfully.',
              type: 'info'
            });
          }}
        >
          Export Financial Audit
        </QuickActionBtn>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Platform GMV (MTD)"
          value="₹18.42 Lakh"
          subtitle="Gross ride bookings"
          icon={IndianRupee}
          color="emerald"
          trend="+22.4%"
          trendType="up"
        />
        <MetricCard
          title="Net Commission (20%)"
          value="₹3.68 Lakh"
          subtitle="Platform net revenue"
          icon={TrendingUp}
          color="rose"
          trend="+18.9%"
          trendType="up"
        />
        <MetricCard
          title="Pending Driver Payouts"
          value="₹1.42 Lakh"
          subtitle="Batch awaiting sign-off"
          icon={CreditCard}
          color="amber"
          trend="48 drivers queued"
          trendType="neutral"
        />
        <MetricCard
          title="Payment Success Rate"
          value="99.4%"
          subtitle="Razorpay & UPI gateway"
          icon={ShieldCheck}
          color="teal"
          trend="+0.3%"
          trendType="up"
        />
      </div>

      {/* Payout Batches Table */}
      <DataTable
        title="Driver Weekly Disbursement Batches"
        subtitle="Consolidated bank transfer runs requiring Chief Financial Controller sign-off"
        columns={columns}
        data={batches}
        searchPlaceholder="Search batches by ID, date or amount..."
        searchKeys={['batchId', 'date', 'totalAmount']}
      />

      {/* Batch Authorization Modal */}
      {selectedBatch && (
        <DetailModal
          isOpen={Boolean(selectedBatch)}
          onClose={() => setSelectedBatch(null)}
          title={`Authorize Disbursement: ${selectedBatch.batchId}`}
          subtitle={`Disbursement Date: ${selectedBatch.date} • Beneficiaries: ${selectedBatch.driverCount} Drivers`}
          badge={<StatusPill status={selectedBatch.status} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedBatch(null)}
              >
                Close
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={Check}
                onClick={() => handleAuthorizeBatch(selectedBatch.batchId)}
              >
                Authorize & Release Funds
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Gross Wire Transfer Total:</span>
                <p className="font-extrabold text-emerald-400 text-xl mt-0.5">{selectedBatch.totalAmount}</p>
              </div>
              <div>
                <span className="text-neutral-500">Transfer Channel:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedBatch.method}</p>
              </div>
              <div>
                <span className="text-neutral-500">Platform Gateway Fee:</span>
                <p className="font-bold text-neutral-300 mt-0.5">{selectedBatch.gatewayFee}</p>
              </div>
              <div>
                <span className="text-neutral-500">Compliance Verification:</span>
                <p className="font-bold text-teal-400 mt-0.5">TDS Deducted & Verified (1%)</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 text-xs leading-relaxed">
              Upon authorization, an encrypted payload with account numbers and IFSC routing codes is dispatched to the banking gateway. Funds are cleared within 30 minutes.
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
