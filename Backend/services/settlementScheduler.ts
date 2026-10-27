import cron from 'node-cron';
import { calculateWeeklySettlement } from './settlementService.js';

let isJobRunning = false;

/**
 * Initializes the automated weekly settlement cron scheduler
 */
export function initSettlementScheduler() {
  const cronExpression = process.env.SETTLEMENT_CRON_SCHEDULE || '0 2 * * 1'; // Every Monday at 02:00 AM
  const timezone = process.env.SETTLEMENT_TIMEZONE || 'Asia/Kolkata';

  if (!cron.validate(cronExpression)) {
    console.error(`❌ Invalid cron expression for settlement scheduler: "${cronExpression}"`);
    return;
  }

  console.log(`⏰ Initializing Weekly Settlement Scheduler: [${cronExpression}] in ${timezone}`);

  cron.schedule(
    cronExpression,
    async () => {
      if (isJobRunning) {
        console.warn('⚠️ Weekly settlement job is already running. Skipping overlapping execution.');
        return;
      }

      isJobRunning = true;
      const startTime = new Date();
      console.log(`\n======================================================`);
      console.log(`🚀 [Weekly Settlement Scheduler] Started at ${startTime.toISOString()}`);
      console.log(`   Configured Timezone: ${timezone}`);
      console.log(`======================================================`);

      try {
        const result = await calculateWeeklySettlement({
          isDryRun: true, // Safe dry-run mode
          authorizedById: 'automated_scheduler',
        });

        console.log(`✅ [Weekly Settlement] Batch calculated successfully:`);
        console.log(`   Batch Reference: ${result.batch?.batchReference}`);
        console.log(`   Beneficiaries: ${result.batch?.beneficiaryCount}`);
        console.log(`   Gross Fare: ₹${Number(result.batch?.grossFare).toFixed(2)}`);
        console.log(`   Platform Commission: ₹${Number(result.batch?.platformFee).toFixed(2)}`);
        console.log(`   Net Payable: ₹${Number(result.batch?.netPayable).toFixed(2)}`);
        console.log(`   Status: ${result.batch?.status} (Dry-Run: ${result.isDryRun})`);
      } catch (err: any) {
        console.error('❌ [Weekly Settlement Scheduler Error]:', err?.message || err);
      } finally {
        isJobRunning = false;
        console.log(`🏁 [Weekly Settlement Scheduler] Finished in ${Date.now() - startTime.getTime()}ms\n`);
      }
    },
    {
      timezone,
    }
  );
}
