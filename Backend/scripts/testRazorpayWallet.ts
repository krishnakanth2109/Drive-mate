import 'dotenv/config';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  razorpay,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getAuthoritativeWallet,
  createTopupOrder,
  verifyTopupPayment,
  deductRideFare,
  creditRefund,
  handleRazorpayWebhook,
} from '../services/walletService.js';

async function runRazorpayWalletIntegrationTest() {
  console.log('========================================================================');
  console.log('💳 DRIVEMATE RAZORPAY WALLET PAYMENT INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

  // STEP 1: Verify Configuration & Razorpay Cloud Gateway Connectivity
  console.log('🔍 [1/7] Testing Razorpay API Gateway Credentials & Connectivity...');
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  console.log(`   Key ID          : ${keyId}`);
  console.log(`   Key Secret Mask : ${keySecret.slice(0, 4)}********`);

  const directOrder = await razorpay.orders.create({
    amount: 10000, // ₹100.00
    currency: 'INR',
    receipt: `rcpt_test_gw_${Date.now()}`,
    notes: { system: 'DriveMate_Gateway_Verification' },
  });

  if (!directOrder || !directOrder.id) {
    throw new Error('Direct Razorpay API order creation failed');
  }
  console.log(`   Gateway Status  : ✅ ACTIVE & REACHABLE`);
  console.log(`   Razorpay Order  : ${directOrder.id} (₹${(Number(directOrder.amount) / 100).toFixed(2)})\n`);

  // STEP 2: Pick or Provision Customer User
  console.log('👤 [2/7] Loading Customer Profile from Neon PostgreSQL...');
  let customer = await prisma.customer.findFirst({
    where: { email: 'customer@drivemate.com' },
  });

  if (!customer) {
    customer = await prisma.customer.findFirst();
  }

  if (!customer) {
    throw new Error('No customer found in database to test');
  }

  console.log(`   Customer ID     : ${customer.id}`);
  console.log(`   Customer Name   : ${customer.name}`);
  console.log(`   Customer Email  : ${customer.email}`);

  const initialCustWallet = await getAuthoritativeWallet(customer.id, 'customer');
  console.log(`   Initial Balance : ₹${initialCustWallet.balance.toFixed(2)}\n`);

  // STEP 3: Customer Top-Up Order Creation
  const topupAmount = 250.00;
  console.log(`📦 [3/7] Creating Top-Up Order for ₹${topupAmount.toFixed(2)}...`);
  const topupOrder = await createTopupOrder(customer.id, 'customer', topupAmount);
  console.log(`   Razorpay Order  : ${topupOrder.orderId}`);
  console.log(`   Amount (Paise)  : ${topupOrder.amountPaise}`);
  console.log(`   Receipt Ref     : ${topupOrder.receipt}`);
  console.log(`   Order Status    : ${topupOrder.status}`);

  // Verify in PostgreSQL
  const dbOrder = await prisma.paymentOrder.findUnique({
    where: { orderId: topupOrder.orderId },
  });
  if (!dbOrder || dbOrder.status !== 'created') {
    throw new Error('PaymentOrder record was not created properly in database');
  }
  console.log(`   Database Sync   : ✅ PaymentOrder recorded in Neon PostgreSQL (status: ${dbOrder.status})\n`);

  // STEP 4: Security Signature Check - Reject Tampered Signature
  console.log('🛡️ [4/7] Testing Cryptographic HMAC Signature Guard (Tamper Rejection)...');
  const syntheticPaymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;
  const tamperedSignature = 'tampered_fake_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef';

  let rejectionCaught = false;
  try {
    await verifyTopupPayment(customer.id, 'customer', {
      razorpay_order_id: topupOrder.orderId,
      razorpay_payment_id: syntheticPaymentId,
      razorpay_signature: tamperedSignature,
    });
  } catch (err: any) {
    rejectionCaught = true;
    console.log(`   Tamper Guard    : ✅ Correctly rejected forged signature (${err.message})`);
  }

  if (!rejectionCaught) {
    throw new Error('Security vulnerability: Tampered signature was not rejected!');
  }

  // STEP 5: Authoritative Payment Verification & Atomic Balance Credit
  console.log('\n💰 [5/7] Verifying Valid Payment & Atomically Crediting Wallet...');
  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${topupOrder.orderId}|${syntheticPaymentId}`)
    .digest('hex');

  const verifyResult = await verifyTopupPayment(customer.id, 'customer', {
    razorpay_order_id: topupOrder.orderId,
    razorpay_payment_id: syntheticPaymentId,
    razorpay_signature: validSignature,
  });

  console.log(`   Verify Result   : ✅ ${verifyResult.message}`);
  console.log(`   New Balance     : ₹${verifyResult.newBalance.toFixed(2)}`);

  // Verify exact math
  const expectedBalance = initialCustWallet.balance + topupAmount;
  if (Math.abs(verifyResult.newBalance - expectedBalance) > 0.01) {
    throw new Error(`Balance mismatch: Expected ₹${expectedBalance}, got ₹${verifyResult.newBalance}`);
  }
  console.log(`   Math Validation : ✅ Balance increased by exactly ₹${topupAmount.toFixed(2)}`);

  // Verify Idempotency Protection
  console.log('   Testing Replay Protection (Double-Credit Prevention)...');
  const replayResult = await verifyTopupPayment(customer.id, 'customer', {
    razorpay_order_id: topupOrder.orderId,
    razorpay_payment_id: syntheticPaymentId,
    razorpay_signature: validSignature,
  });
  if (!replayResult.alreadyProcessed || replayResult.balance !== verifyResult.newBalance) {
    throw new Error('Idempotency check failed: Replayed payment modified balance or was not caught');
  }
  console.log(`   Replay Guard    : ✅ Replay safely intercepted (alreadyProcessed: true, no duplicate credit)\n`);

  // STEP 6: Ride Fare Deduction & Refund Simulation
  console.log('🚖 [6/7] Testing Ride Fare Deduction & Instant Refund Handling...');
  const fareAmount = 85.50;
  const testRideId = `ride_test_${Date.now()}`;

  const deductionResult = await deductRideFare(customer.id, 'customer', {
    amount: fareAmount,
    rideId: testRideId,
    description: 'Ride Fare - Test Trip Hyderabad to Hitech City',
  });
  console.log(`   Fare Deducted   : ₹${fareAmount.toFixed(2)} for ${testRideId}`);
  console.log(`   Balance After   : ₹${deductionResult.newBalance.toFixed(2)}`);

  const refundResult = await creditRefund(customer.id, 'customer', {
    amount: fareAmount,
    referenceId: testRideId,
    reason: 'Driver cancelled trip - automatic full wallet refund',
  });
  console.log(`   Refund Credited : ₹${fareAmount.toFixed(2)} (Reason: ${refundResult.transaction.description})`);
  console.log(`   Balance Restored: ₹${refundResult.newBalance.toFixed(2)}`);

  if (Math.abs(refundResult.newBalance - verifyResult.newBalance) > 0.01) {
    throw new Error('Balance restoration mismatch after refund');
  }
  console.log(`   Audit Ledger    : ✅ Full cycle debit and credit verified\n`);

  // STEP 7: Webhook Processing
  console.log('📡 [7/7] Testing Webhook Signature Verification & Processing...');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
  const sampleWebhookEvent = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_failed_${Date.now()}`,
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'failed',
          order_id: topupOrder.orderId,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed due to insufficient funds at bank',
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawWebhookBody = JSON.stringify(sampleWebhookEvent);
  const webhookSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawWebhookBody)
    .digest('hex');

  const webhookResult = await handleRazorpayWebhook(rawWebhookBody, webhookSignature);
  console.log(`   Webhook Result  : ✅ Signature verified and handled successfully (${JSON.stringify(webhookResult)})`);

  console.log('\n========================================================================');
  console.log('🎉 ALL 7 RAZORPAY WALLET PAYMENT INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('========================================================================');
}

runRazorpayWalletIntegrationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Integration Test Error:', err);
    process.exit(1);
  });
