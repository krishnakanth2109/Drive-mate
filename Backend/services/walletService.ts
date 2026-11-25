import 'dotenv/config';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

// Safe dynamic getters with reliable test fallbacks
export const getRazorpayKeyId = (): string =>
  process.env.RAZORPAY_KEY_ID?.trim() || 'rzp_test_SgtZz5GYGtOM5F';

export const getRazorpayKeySecret = (): string =>
  process.env.RAZORPAY_KEY_SECRET?.trim() || 'CKHn0hMFVvCnvlWly2301mUl';

export const razorpay = new Razorpay({
  key_id: getRazorpayKeyId(),
  key_secret: getRazorpayKeySecret(),
});

export const generateId = (): string => crypto.randomBytes(12).toString('hex');

/**
 * Retrieves existing wallet or creates one atomically, syncing initial balance from Customer/Rider record.
 */
export async function getOrCreateWallet(userId: string, userType: 'customer' | 'rider' = 'customer') {
  let wallet = await prisma.wallet.findFirst({
    where: { userId, userType },
  });

  if (!wallet) {
    // Check initial balance from user table if available and safely verify existence to avoid FK violation
    let initialBalance = 0;
    let validCustomerId: string | null = null;
    let validRiderId: string | null = null;

    if (userType === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { id: userId },
        select: { id: true, walletBalance: true },
      });
      if (customer) {
        initialBalance = Number(customer.walletBalance || 0);
        validCustomerId = customer.id;
      }
    } else {
      const rider = await prisma.rider.findUnique({
        where: { id: userId },
        select: { id: true, walletBalance: true },
      });
      if (rider) {
        initialBalance = Number(rider.walletBalance || 0);
        validRiderId = rider.id;
      }
    }

    wallet = await prisma.wallet.create({
      data: {
        id: generateId(),
        userId,
        userType,
        balance: initialBalance,
        currency: 'INR',
        status: 'active',
        customerId: validCustomerId,
        riderId: validRiderId,
      },
    });
  }

  return wallet;
}

/**
 * Returns the authoritative wallet balance and active status.
 */
export async function getAuthoritativeWallet(userId: string, userType: 'customer' | 'rider' = 'customer') {
  const wallet = await getOrCreateWallet(userId, userType);
  return {
    walletId: wallet.id,
    userId: wallet.userId,
    userType: wallet.userType,
    currency: wallet.currency,
    balance: Number(wallet.balance),
    lockedBalance: Number(wallet.lockedBalance),
    availableBalance: Number(wallet.balance) - Number(wallet.lockedBalance),
    status: wallet.status,
    updatedAt: wallet.updatedAt,
  };
}

/**
 * Paginated transaction ledger
 */
export async function getPaginatedTransactions(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  options: { page?: number; limit?: number; type?: string; direction?: string } = {}
) {
  const wallet = await getOrCreateWallet(userId, userType);
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options.limit || 15)));
  const skip = (page - 1) * limit;

  const whereClause: any = { walletId: wallet.id };
  if (options.type && options.type !== 'ALL') {
    whereClause.type = options.type;
  }
  if (options.direction) {
    whereClause.direction = options.direction;
  }

  const [totalCount, items] = await Promise.all([
    prisma.walletTransaction.count({ where: whereClause }),
    prisma.walletTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    items: items.map((tx) => ({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: Number(tx.amount),
      direction: tx.direction,
      balanceBefore: Number(tx.balanceBefore),
      balanceAfter: Number(tx.balanceAfter),
      currency: tx.currency,
      status: tx.status,
      referenceId: tx.referenceId,
      referenceType: tx.referenceType,
      description: tx.description,
      metadata: tx.metadata,
      failureReason: tx.failureReason,
      createdAt: tx.createdAt,
    })),
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Creates a Razorpay payment order on the backend for top-up
 */
export async function createTopupOrder(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  amount: number,
  idempotencyKey?: string
) {
  if (isNaN(amount) || amount < 10) {
    throw new ApiError(400, 'Minimum top-up amount is ₹10.00');
  }
  if (amount > 50000) {
    throw new ApiError(400, 'Maximum top-up amount per transaction is ₹50,000.00');
  }

  const wallet = await getOrCreateWallet(userId, userType);

  // Check idempotency if provided
  if (idempotencyKey) {
    const existingOrder = await prisma.paymentOrder.findUnique({
      where: { idempotencyKey },
    });
    if (existingOrder) {
      return {
        orderId: existingOrder.orderId,
        amount: Number(existingOrder.amount),
        amountPaise: existingOrder.amountPaise,
        currency: existingOrder.currency,
        receipt: existingOrder.receipt,
        keyId: getRazorpayKeyId(),
        status: existingOrder.status,
      };
    }
  }

  const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const amountPaise = Math.round(amount * 100);

  let razorpayOrder: any;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: true,
      notes: {
        userId,
        userType,
        walletId: wallet.id,
        purpose: 'wallet_topup',
      },
    });
  } catch (err: any) {
    console.error('Razorpay order creation error:', err);
    throw new ApiError(502, `Payment gateway error: ${err.message || 'Failed to create order'}`);
  }

  const savedOrder = await prisma.paymentOrder.create({
    data: {
      id: generateId(),
      walletId: wallet.id,
      userId,
      userType,
      orderId: razorpayOrder.id,
      amount,
      amountPaise,
      currency: 'INR',
      status: 'created',
      receipt,
      idempotencyKey: idempotencyKey || null,
    },
  });

  return {
    orderId: savedOrder.orderId,
    amount: Number(savedOrder.amount),
    amountPaise: savedOrder.amountPaise,
    currency: savedOrder.currency,
    receipt: savedOrder.receipt,
    keyId: getRazorpayKeyId(),
    status: savedOrder.status,
  };
}

/**
 * Securely verifies payment signature and authoritative Razorpay payment status,
 * then atomically credits the wallet.
 */
export async function verifyTopupPayment(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Missing required payment verification parameters');
  }

  // 1. Locate the order in our database
  const order = await prisma.paymentOrder.findUnique({
    where: { orderId: razorpay_order_id },
  });

  if (!order) {
    throw new ApiError(404, 'Payment order not found');
  }

  if (userId && order.userId !== userId) {
    throw new ApiError(403, 'Order does not belong to the authenticated user');
  }

  const effectiveUserId = order.userId;
  const effectiveUserType = (order.userType as 'customer' | 'rider') || userType;

  // Idempotency check: if order is already marked 'paid', return authoritative wallet state immediately
  if (order.status === 'paid') {
    const wallet = await getAuthoritativeWallet(effectiveUserId, effectiveUserType);
    return {
      success: true,
      alreadyProcessed: true,
      message: 'Payment was already verified and credited.',
      balance: wallet.balance,
      orderId: order.orderId,
      paymentId: order.razorpayPaymentId,
    };
  }

  // 2. Validate cryptographic signature using HMAC SHA256 timing-safe comparison
  const expectedSignature = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValidSignature =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!isValidSignature) {
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'failed',
        errorCode: 'SIGNATURE_MISMATCH',
        errorDescription: 'Invalid cryptographic signature from gateway',
      },
    });
    throw new ApiError(400, 'Invalid payment signature. Verification failed.');
  }

  // 3. Authoritative verification with Razorpay API (Fetch Payment Status)
  let paymentDetails: any = null;
  try {
    paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
  } catch (err: any) {
    // If it's a simulated or test payment ID with a valid HMAC signature, accept gracefully
    if (
      razorpay_payment_id.startsWith('pay_test_') ||
      razorpay_payment_id.startsWith('pay_sim_') ||
      razorpay_payment_id.startsWith('pay_mock_')
    ) {
      console.warn(`[Razorpay] Simulated payment ${razorpay_payment_id} detected with valid HMAC. Accepting test payment.`);
      paymentDetails = {
        id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: order.amountPaise,
        status: 'captured',
        method: 'upi',
      };
    } else {
      console.error('Failed to fetch payment details from Razorpay:', err);
      throw new ApiError(502, `Gateway communication error: ${err.message || 'Could not verify payment'}`);
    }
  }

  if (!paymentDetails) {
    throw new ApiError(400, 'Payment details could not be retrieved from provider');
  }

  if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
    throw new ApiError(400, 'Payment order mismatch between provider and verification request');
  }

  if (paymentDetails.amount && paymentDetails.amount !== order.amountPaise) {
    throw new ApiError(400, 'Payment amount mismatch between provider and internal order');
  }

  // Check if payment status is captured (or capture if authorized)
  if (paymentDetails.status !== 'captured') {
    if (paymentDetails.status === 'authorized') {
      try {
        paymentDetails = await razorpay.payments.capture(
          razorpay_payment_id,
          order.amountPaise,
          order.currency
        );
      } catch (captureErr: any) {
        console.error('Failed to capture authorized payment:', captureErr);
        throw new ApiError(502, 'Payment capture failed on payment gateway');
      }
    } else {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: paymentDetails.status,
          errorCode: 'PAYMENT_NOT_CAPTURED',
          errorDescription: `Provider status: ${paymentDetails.status}`,
        },
      });
      throw new ApiError(400, `Payment is not in captured status (Current status: ${paymentDetails.status})`);
    }
  }

  // 4. Atomic PostgreSQL Transaction: Credit wallet, update order, and record ledger entry
  const result = await prisma.$transaction(async (tx) => {
    // Re-check order status inside transaction to prevent concurrent double-credit race
    const freshOrder = await tx.paymentOrder.findUnique({
      where: { id: order.id },
    });
    if (freshOrder?.status === 'paid') {
      const w = await tx.wallet.findUnique({ where: { id: order.walletId } });
      return { wallet: w, duplicate: true };
    }

    const currentWallet = await tx.wallet.findUnique({
      where: { id: order.walletId },
    });
    if (!currentWallet) {
      throw new ApiError(404, 'Wallet record not found');
    }

    const balanceBefore = currentWallet.balance;
    const balanceAfter = Number(balanceBefore) + Number(order.amount);

    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: currentWallet.id },
      data: {
        balance: { increment: order.amount },
      },
    });

    // Safely sync legacy customer/rider table balance if user exists
    if (effectiveUserType === 'customer') {
      const cust = await tx.customer.findUnique({ where: { id: effectiveUserId }, select: { id: true } });
      if (cust) {
        await tx.customer.update({
          where: { id: effectiveUserId },
          data: { walletBalance: { increment: order.amount } },
        });
      }
    } else {
      const rd = await tx.rider.findUnique({ where: { id: effectiveUserId }, select: { id: true } });
      if (rd) {
        await tx.rider.update({
          where: { id: effectiveUserId },
          data: { walletBalance: { increment: order.amount } },
        });
      }
    }

    // Mark payment order as paid
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        verifiedAt: new Date(),
      },
    });

    // Create immutable audit ledger record
    const paymentMethodType = paymentDetails?.method || 'Online';
    const newTx = await tx.walletTransaction.create({
      data: {
        id: generateId(),
        walletId: currentWallet.id,
        type: 'TOPUP',
        amount: order.amount,
        direction: 'CREDIT',
        balanceBefore,
        balanceAfter,
        currency: 'INR',
        status: 'SUCCESS',
        referenceId: order.orderId,
        referenceType: 'PAYMENT_ORDER',
        description: `Wallet Recharged via Razorpay (${paymentMethodType.toUpperCase()})`,
        metadata: {
          razorpayPaymentId: razorpay_payment_id,
          method: paymentDetails?.method,
          bank: paymentDetails?.bank || null,
          vpa: paymentDetails?.vpa || null,
          wallet: paymentDetails?.wallet || null,
        },
      },
    });

    // Also create legacy transaction for backward compatibility with existing views
    await tx.transaction.create({
      data: {
        id: generateId(),
        userId,
        userModel: userType === 'customer' ? 'Customer' : 'Rider',
        type: 'credit',
        amount: order.amount,
        currency: 'INR',
        description: `Wallet Recharged via Razorpay (${paymentMethodType.toUpperCase()})`,
        referenceId: razorpay_payment_id,
      },
    });

    return { wallet: updatedWallet, transaction: newTx, duplicate: false };
  });

  return {
    success: true,
    message: 'Wallet credited successfully',
    orderId: order.orderId,
    paymentId: razorpay_payment_id,
    newBalance: Number(result.wallet?.balance),
    transaction: result.transaction,
  };
}

/**
 * Atomic ride fare deduction from wallet
 */
export async function deductRideFare(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  params: {
    amount: number;
    rideId: string;
    description?: string;
    idempotencyKey?: string;
  }
) {
  const { amount, rideId, description, idempotencyKey } = params;

  if (isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'Invalid ride fare amount');
  }

  const wallet = await getOrCreateWallet(userId, userType);

  return await prisma.$transaction(async (tx) => {
    // 1. Check idempotency
    if (idempotencyKey) {
      const existingTx = await tx.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return {
          success: true,
          alreadyProcessed: true,
          transaction: existingTx,
          balance: Number(existingTx.balanceAfter),
        };
      }
    }

    // Also check if ride fare was already deducted for this rideId
    const existingRideTx = await tx.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        referenceId: rideId,
        type: 'RIDE_FARE',
      },
    });
    if (existingRideTx) {
      return {
        success: true,
        alreadyProcessed: true,
        transaction: existingRideTx,
        balance: Number(existingRideTx.balanceAfter),
      };
    }

    // 2. Lock and retrieve current wallet
    const currentWallet = await tx.wallet.findUnique({
      where: { id: wallet.id },
    });
    if (!currentWallet) throw new ApiError(404, 'Wallet not found');

    const currentBalance = Number(currentWallet.balance);
    if (currentBalance < amount) {
      throw new ApiError(400, `Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`);
    }

    const balanceBefore = currentWallet.balance;
    const balanceAfter = currentBalance - amount;

    // 3. Atomically decrement wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: currentWallet.id },
      data: {
        balance: { decrement: amount },
      },
    });

    // 4. Safely sync Customer or Rider balance
    if (userType === 'customer') {
      const cust = await tx.customer.findUnique({ where: { id: userId }, select: { id: true } });
      if (cust) {
        await tx.customer.update({
          where: { id: userId },
          data: { walletBalance: { decrement: amount } },
        });
      }
    } else {
      const rd = await tx.rider.findUnique({ where: { id: userId }, select: { id: true } });
      if (rd) {
        await tx.rider.update({
          where: { id: userId },
          data: { walletBalance: { decrement: amount } },
        });
      }
    }

    // 5. Create auditable transaction entry
    const newTx = await tx.walletTransaction.create({
      data: {
        id: generateId(),
        walletId: currentWallet.id,
        type: 'RIDE_FARE',
        amount,
        direction: 'DEBIT',
        balanceBefore,
        balanceAfter,
        currency: 'INR',
        status: 'SUCCESS',
        referenceId: rideId,
        referenceType: 'RIDE',
        description: description || `Ride Fare Deduction - Trip #${rideId.slice(-6)}`,
        idempotencyKey: idempotencyKey || null,
      },
    });

    // Legacy transaction record
    await tx.transaction.create({
      data: {
        id: generateId(),
        userId,
        userModel: userType === 'customer' ? 'Customer' : 'Rider',
        type: 'debit',
        amount,
        currency: 'INR',
        description: description || `Ride Fare Deduction - Trip #${rideId.slice(-6)}`,
        referenceId: rideId,
      },
    });

    return {
      success: true,
      message: 'Fare deducted successfully from wallet',
      newBalance: Number(updatedWallet.balance),
      transaction: newTx,
    };
  });
}

/**
 * Atomic wallet refund or reversal
 */
export async function creditRefund(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  params: {
    amount: number;
    referenceId?: string;
    referenceType?: string;
    reason: string;
    idempotencyKey?: string;
  }
) {
  const { amount, referenceId, referenceType = 'REFUND_VOUCHER', reason, idempotencyKey } = params;

  if (isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'Invalid refund amount');
  }

  const wallet = await getOrCreateWallet(userId, userType);

  return await prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existingTx = await tx.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return {
          success: true,
          alreadyProcessed: true,
          transaction: existingTx,
          balance: Number(existingTx.balanceAfter),
        };
      }
    }

    const currentWallet = await tx.wallet.findUnique({
      where: { id: wallet.id },
    });
    if (!currentWallet) throw new ApiError(404, 'Wallet not found');

    const balanceBefore = currentWallet.balance;
    const balanceAfter = Number(balanceBefore) + Number(amount);

    const updatedWallet = await tx.wallet.update({
      where: { id: currentWallet.id },
      data: { balance: { increment: amount } },
    });

    if (userType === 'customer') {
      const cust = await tx.customer.findUnique({ where: { id: userId }, select: { id: true } });
      if (cust) {
        await tx.customer.update({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        });
      }
    } else {
      const rd = await tx.rider.findUnique({ where: { id: userId }, select: { id: true } });
      if (rd) {
        await tx.rider.update({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        });
      }
    }

    const newTx = await tx.walletTransaction.create({
      data: {
        id: generateId(),
        walletId: currentWallet.id,
        type: 'REFUND',
        amount,
        direction: 'CREDIT',
        balanceBefore,
        balanceAfter,
        currency: 'INR',
        status: 'SUCCESS',
        referenceId: referenceId || null,
        referenceType,
        description: `Refund / Compensation: ${reason}`,
        idempotencyKey: idempotencyKey || null,
      },
    });

    await tx.transaction.create({
      data: {
        id: generateId(),
        userId,
        userModel: userType === 'customer' ? 'Customer' : 'Rider',
        type: 'credit',
        amount,
        currency: 'INR',
        description: `Refund / Compensation: ${reason}`,
        referenceId: referenceId || null,
      },
    });

    return {
      success: true,
      message: 'Refund credited to wallet successfully',
      newBalance: Number(updatedWallet.balance),
      transaction: newTx,
    };
  });
}

/**
 * Handles incoming Razorpay Webhook with raw body signature verification
 */
export async function handleRazorpayWebhook(rawBody: Buffer | string, signature: string) {
  if (!signature) {
    throw new ApiError(400, 'Missing webhook signature');
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpayKeySecret();
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString)
    .digest('hex');

  const isValid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!isValid) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = JSON.parse(bodyString);
  const eventType = event.event;
  const payload = event.payload;

  console.log(`[Razorpay Webhook] Received event: ${eventType}`);

  if (eventType === 'order.paid' || eventType === 'payment.captured') {
    const payment = payload.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (orderId && paymentId) {
      const order = await prisma.paymentOrder.findUnique({
        where: { orderId },
      });

      if (order && order.status !== 'paid') {
        const dummySig = crypto
          .createHmac('sha256', getRazorpayKeySecret())
          .update(`${orderId}|${paymentId}`)
          .digest('hex');

        await verifyTopupPayment(order.userId, order.userType as any, {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: dummySig,
        });
      }
    }
  } else if (eventType === 'payment.failed') {
    const payment = payload.payment?.entity;
    const orderId = payment?.order_id;

    if (orderId) {
      await prisma.paymentOrder.updateMany({
        where: { orderId, status: 'created' },
        data: {
          status: 'failed',
          errorCode: payment.error_code || 'PAYMENT_FAILED',
          errorDescription: payment.error_description || 'Payment failed on provider',
        },
      });
    }
  }

  return { received: true };
}

/**
 * Helper to simulate a test payment in local / test mode when running in Expo Go
 */
export async function simulateTestPayment(
  userId: string,
  userType: 'customer' | 'rider' = 'customer',
  orderId: string
) {
  const order = await prisma.paymentOrder.findUnique({
    where: { orderId },
  });

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.userId !== userId) throw new ApiError(403, 'Order unauthorized');
  if (order.status === 'paid') {
    const wallet = await getAuthoritativeWallet(userId, userType);
    return {
      success: true,
      alreadyProcessed: true,
      newBalance: wallet.balance,
      orderId,
    };
  }

  const simulatedPaymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;
  const simulatedSignature = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${orderId}|${simulatedPaymentId}`)
    .digest('hex');

  // Credit directly using transactional verify
  const result = await prisma.$transaction(async (tx) => {
    const freshOrder = await tx.paymentOrder.findUnique({ where: { id: order.id } });
    if (freshOrder?.status === 'paid') return { duplicate: true };

    const currentWallet = await tx.wallet.findUnique({ where: { id: order.walletId } });
    if (!currentWallet) throw new ApiError(404, 'Wallet not found');

    const balanceBefore = currentWallet.balance;
    const balanceAfter = Number(balanceBefore) + Number(order.amount);

    const updatedWallet = await tx.wallet.update({
      where: { id: currentWallet.id },
      data: { balance: { increment: order.amount } },
    });

    if (userType === 'customer') {
      const cust = await tx.customer.findUnique({ where: { id: userId }, select: { id: true } });
      if (cust) {
        await tx.customer.update({
          where: { id: userId },
          data: { walletBalance: { increment: order.amount } },
        });
      }
    } else {
      const rd = await tx.rider.findUnique({ where: { id: userId }, select: { id: true } });
      if (rd) {
        await tx.rider.update({
          where: { id: userId },
          data: { walletBalance: { increment: order.amount } },
        });
      }
    }

    await tx.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: simulatedSignature,
        verifiedAt: new Date(),
      },
    });

    const newTx = await tx.walletTransaction.create({
      data: {
        id: generateId(),
        walletId: currentWallet.id,
        type: 'TOPUP',
        amount: order.amount,
        direction: 'CREDIT',
        balanceBefore,
        balanceAfter,
        currency: 'INR',
        status: 'SUCCESS',
        referenceId: order.orderId,
        referenceType: 'PAYMENT_ORDER',
        description: `Wallet Recharged via Razorpay Sandbox (UPI)`,
        metadata: {
          razorpayPaymentId: simulatedPaymentId,
          method: 'upi',
          bank: 'TEST',
          vpa: 'test@razorpay',
        },
      },
    });

    await tx.transaction.create({
      data: {
        id: generateId(),
        userId,
        userModel: userType === 'customer' ? 'Customer' : 'Rider',
        type: 'credit',
        amount: order.amount,
        currency: 'INR',
        description: `Wallet Recharged via Razorpay Sandbox (UPI)`,
        referenceId: simulatedPaymentId,
      },
    });

    return { wallet: updatedWallet, transaction: newTx };
  });

  return {
    success: true,
    message: 'Test payment simulated and wallet credited successfully!',
    orderId,
    paymentId: simulatedPaymentId,
    newBalance: Number(result.wallet?.balance),
  };
}
