import { Router } from 'express';
import {
  getPayoutBatches,
  authorizePayoutBatch,
  getDisbursements,
  executeDisbursement,
  issueRefundVoucher,
  getRefundVouchers,
  getFinanceMetrics,
  getFinancialLedger,
} from '../controllers/financeController.js';

const router = Router();

// Metrics & Financial Overview
router.get('/metrics', getFinanceMetrics);
router.get('/ledger', getFinancialLedger);

// Payout Batches (Finance Admin)
router.get('/batches', getPayoutBatches);
router.patch('/batches/:id/authorize', authorizePayoutBatch);

// Individual Disbursements & Settlements (Financers)
router.get('/disbursements', getDisbursements);
router.patch('/disbursements/:id/execute', executeDisbursement);

// Refund Vouchers (Finance & Customer Support)
router.get('/refunds', getRefundVouchers);
router.post('/refunds', issueRefundVoucher);

export default router;
