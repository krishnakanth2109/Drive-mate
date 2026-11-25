import { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getSettlementBatches,
  getSettlementBatchDetails,
  calculateWeeklySettlement,
  approveSettlementBatch,
  retrySettlementItem,
} from '../services/settlementService.js';

/**
 * GET /api/wallet/admin/settlements — list settlement batches
 */
export const listBatches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, status, isDryRun } = req.query;

  const result = await getSettlementBatches({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    status: status ? String(status) : undefined,
    isDryRun: isDryRun !== undefined ? isDryRun === 'true' : undefined,
  });

  res.status(200).json(new ApiResponse(200, result, 'Settlement batches retrieved'));
});

/**
 * GET /api/wallet/admin/settlements/:id — get settlement batch details & reconciliation
 */
export const getBatchDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const batchId = String(req.params.id);
  const result = await getSettlementBatchDetails(batchId);
  res.status(200).json(new ApiResponse(200, result, 'Settlement batch details retrieved'));
});

/**
 * POST /api/wallet/admin/settlements/calculate — trigger calculation (dry-run or persistent)
 */
export const triggerCalculation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || req.user?._id || 'admin';
  const { isDryRun = true, forceRecalculate = false, year, weekNumber } = req.body;

  let periodOverride: any = undefined;
  if (year && weekNumber) {
    // If specific week was requested
    periodOverride = { year: Number(year), weekNumber: Number(weekNumber) };
  }

  const result = await calculateWeeklySettlement({
    isDryRun: Boolean(isDryRun),
    forceRecalculate: Boolean(forceRecalculate),
    authorizedById: adminId,
    period: periodOverride,
  });

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/wallet/admin/settlements/:id/approve — approve a calculated settlement batch
 */
export const approveBatch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || req.user?._id || 'admin';
  const batchId = String(req.params.id);
  const { notes } = req.body;

  const result = await approveSettlementBatch(batchId, adminId, notes);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/wallet/admin/settlements/items/:itemId/retry — retry a failed settlement item
 */
export const retryItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || req.user?._id || 'admin';
  const itemId = String(req.params.itemId);

  const result = await retrySettlementItem(itemId, adminId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * GET /api/wallet/admin/settlements/:id/export — export settlement report
 */
export const exportReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const batchId = String(req.params.id);
  const result = await getSettlementBatchDetails(batchId);

  const reportData = {
    batchReference: result.batch.batchReference,
    periodStart: result.batch.periodStart,
    periodEnd: result.batch.periodEnd,
    timezone: result.batch.periodTimezone,
    status: result.batch.status,
    isDryRun: result.batch.isDryRun,
    reconciliation: result.reconciliation,
    totals: {
      totalRides: result.batch.totalRides,
      grossFare: result.batch.grossFare,
      platformFee: result.batch.platformFee,
      netPayable: result.batch.netPayable,
      beneficiaryCount: result.batch.beneficiaryCount,
    },
    items: result.batch.items.map((i: any) => ({
      payoutRef: i.payoutRef,
      driverName: i.beneficiaryName,
      driverPhone: i.beneficiaryPhone,
      bankAccount: i.bankAccountNumber,
      ifsc: i.ifscCode,
      rides: i.rideCount,
      grossAmount: i.grossAmount,
      deductions: i.deductions,
      incentives: i.incentives,
      netAmount: i.netAmount,
      status: i.status,
    })),
  };

  res.status(200).json(new ApiResponse(200, reportData, 'Settlement report exported successfully'));
});
