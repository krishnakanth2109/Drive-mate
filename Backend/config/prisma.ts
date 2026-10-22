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

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

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
