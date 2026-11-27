import 'dotenv/config';
import dns from 'dns';
import { createRequire } from 'module';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const require = createRequire(import.meta.url);
const WebSocket: any = require('ws');

// Fallback public DNS resolver in case local ISP/router DNS refuses *.neon.tech queries
const fallbackResolver = new dns.Resolver();
fallbackResolver.setServers(['8.8.8.8', '1.1.1.1']);

function resilientLookup(
  hostname: string,
  options: dns.LookupAllOptions | dns.LookupOneOptions | ((err: NodeJS.ErrnoException | null, address: any, family?: number) => void),
  callback?: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
) {
  let opts: any = options;
  let cb: any = callback;
  if (typeof options === 'function') {
    cb = options;
    opts = {};
  }

  dns.lookup(hostname, opts, (err, address, family) => {
    if (!err) {
      return cb(null, address, family);
    }
    fallbackResolver.resolve4(hostname, (rErr, addresses) => {
      if (rErr || !addresses || addresses.length === 0) {
        return cb(err);
      }
      if (opts && opts.all) {
        return cb(
          null,
          addresses.map((ip) => ({ address: ip, family: 4 }))
        );
      }
      return cb(null, addresses[0], 4);
    });
  });
}

class ResilientNeonWebSocket extends WebSocket {
  constructor(address: string, protocols?: any, options?: any) {
    super(address, protocols, {
      ...(options || {}),
      lookup: resilientLookup,
    });
  }
}

neonConfig.webSocketConstructor = ResilientNeonWebSocket as any;

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
  wallet: any;
  walletTransaction: any;
  paymentOrder: any;
  settlementBatch: any;
  settlementItem: any;
  idempotencyRecord: any;
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
