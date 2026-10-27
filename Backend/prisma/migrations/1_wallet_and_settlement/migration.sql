-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL DEFAULT 'customer',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "locked_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'active',
    "customer_id" TEXT,
    "rider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "direction" TEXT NOT NULL,
    "balance_before" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "reference_id" TEXT,
    "reference_type" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "failure_reason" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL DEFAULT 'customer',
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "receipt" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "idempotency_key" TEXT,
    "error_code" TEXT,
    "error_description" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_batches" (
    "id" TEXT NOT NULL,
    "batch_reference" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "period_timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "settlement_type" TEXT NOT NULL DEFAULT 'DRIVER_EARNINGS',
    "total_rides" INTEGER NOT NULL DEFAULT 0,
    "gross_fare" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "platform_fee" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_payable" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "beneficiary_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "is_dry_run" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorized_by_id" TEXT,
    "authorized_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "beneficiary_id" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "beneficiary_phone" TEXT NOT NULL,
    "bank_account_number" TEXT,
    "ifsc_code" TEXT,
    "ride_count" INTEGER NOT NULL DEFAULT 0,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "incentives" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payout_ref" TEXT,
    "failure_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_code" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_customer_id_key" ON "wallets"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_rider_id_key" ON "wallets"("rider_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_user_type_key" ON "wallets"("user_id", "user_type");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_id_idx" ON "wallet_transactions"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_order_id_key" ON "payment_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_receipt_key" ON "payment_orders"("receipt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_razorpay_payment_id_key" ON "payment_orders"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_idempotency_key_key" ON "payment_orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_status_idx" ON "payment_orders"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_batches_batch_reference_key" ON "settlement_batches"("batch_reference");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_items_payout_ref_key" ON "settlement_items"("payout_ref");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_items_batch_id_beneficiary_id_key" ON "settlement_items"("batch_id", "beneficiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_key" ON "idempotency_records"("key");

-- CreateIndex
CREATE INDEX "idempotency_records_key_expires_at_idx" ON "idempotency_records"("key", "expires_at");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_authorized_by_id_fkey" FOREIGN KEY ("authorized_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "settlement_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
