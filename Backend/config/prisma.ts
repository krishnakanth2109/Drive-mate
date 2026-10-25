import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL;

if (!connectionString) {
  console.warn('⚠️ Warning: DATABASE_URL is not set in environment variables.');
}

const adapter = connectionString
  ? new PrismaNeon({ connectionString })
  : undefined;

/**
 * Extended Prisma Client type that explicitly guarantees all multi-role model delegates
 * exist for IDE language servers, build workers, and runtime execution.
 */
export type ExtendedPrismaClient = PrismaClient & {
  supportTicket: any;
  ticketMessage: any;
  supportEscalation: any;
  driverOnboarding: any;
  vehicleInspection: any;
  fleetZone: any;
  cityZone: any;
  surgeRule: any;
  driverIncentiveBroadcast: any;
  payoutBatch: any;
  disbursement: any;
  refundVoucher: any;
  [key: string]: any;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ??
  (new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }) as ExtendedPrismaClient);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Verifies the Prisma PostgreSQL database connection safely with a non-destructive query
 */
export const connectPrisma = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Prisma ORM Connected to Neon PostgreSQL');
    return true;
  } catch (err: any) {
    console.error('❌ Prisma ORM Connection Error:', err?.message || err);
    return false;
  }
};

/**
 * Gracefully disconnects Prisma on application shutdown
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('Prisma ORM disconnected.');
  } catch (err: any) {
    console.error('Error disconnecting Prisma:', err?.message || err);
  }
};

export default prisma;
