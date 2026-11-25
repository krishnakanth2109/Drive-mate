import dotenv from 'dotenv';
import { createClient, RedisClientType } from 'redis';

dotenv.config();

export interface DriveMateRedisClient {
  isOpen: boolean;
  isRealRedis: boolean;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  setEx: (key: string, seconds: number, value: string) => Promise<void>;
  del: (key: string | string[]) => Promise<number | void>;
  exists: (key: string) => Promise<boolean>;
  keys: (pattern: string) => Promise<string[]>;
  ttl: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<boolean>;
  flushAll: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  getStats: () => { mode: 'redis' | 'memory'; totalKeys: number; memoryUsageBytes?: number };
}

interface CacheItem {
  value: string;
  expiresAt: number | null; // null = never expires
}

/**
 * High-performance In-Memory Redis Engine with true TTL expiration,
 * wildcard pattern matching, atomic increments, and automatic memory cleanup.
 */
class InMemoryRedisEngine implements DriveMateRedisClient {
  public isOpen: boolean = true;
  public isRealRedis: boolean = false;
  private store: Map<string, CacheItem> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    // Run periodic cleanup for expired keys every 60 seconds
    this.cleanupTimer = setInterval(() => this.purgeExpiredKeys(), 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  private purgeExpiredKeys(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt !== null && item.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  public async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt !== null && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  public async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value: String(value), expiresAt: null });
  }

  public async setEx(key: string, seconds: number, value: string): Promise<void> {
    const expiresAt = Date.now() + Math.max(1, seconds) * 1000;
    this.store.set(key, { value: String(value), expiresAt });
  }

  public async del(keyOrKeys: string | string[]): Promise<number> {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    let deletedCount = 0;
    for (const k of keys) {
      if (this.store.delete(k)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  public async keys(pattern: string): Promise<string[]> {
    this.purgeExpiredKeys();
    if (!pattern || pattern === '*') {
      return Array.from(this.store.keys());
    }

    // Convert Redis glob pattern (e.g. "cache:*", "user:*") to RegExp
    const regexPattern = new RegExp(
      '^' + pattern.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\*/g, '.*') + '$'
    );

    const matches: string[] = [];
    for (const k of this.store.keys()) {
      if (regexPattern.test(k)) {
        matches.push(k);
      }
    }
    return matches;
  }

  public async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2; // Key does not exist
    if (item.expiresAt === null) return -1; // Key exists but has no expiration

    const remainingSecs = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remainingSecs > 0 ? remainingSecs : -2;
  }

  public async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const num = current ? parseInt(current, 10) : 0;
    const newVal = isNaN(num) ? 1 : num + 1;
    const item = this.store.get(key);
    this.store.set(key, {
      value: String(newVal),
      expiresAt: item?.expiresAt || null,
    });
    return newVal;
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    const item = this.store.get(key);
    if (!item) return false;
    item.expiresAt = Date.now() + Math.max(1, seconds) * 1000;
    return true;
  }

  public async flushAll(): Promise<void> {
    this.store.clear();
  }

  public async connect(): Promise<void> {
    this.isOpen = true;
  }

  public async disconnect(): Promise<void> {
    this.isOpen = false;
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public getStats() {
    this.purgeExpiredKeys();
    let approximateBytes = 0;
    for (const [k, v] of this.store.entries()) {
      approximateBytes += k.length * 2 + v.value.length * 2;
    }
    return {
      mode: 'memory' as const,
      totalKeys: this.store.size,
      memoryUsageBytes: approximateBytes,
    };
  }
}

// In-Memory Engine Instance
const memoryEngine = new InMemoryRedisEngine();

// Primary Reference
let activeClient: DriveMateRedisClient = memoryEngine;
let nativeClient: RedisClientType | null = null;
let isConnectedToNativeRedis = false;

/**
 * Initializes Redis connection.
 * Connects to standalone/cloud Redis if available, or seamlessly activates
 * the In-Memory Redis Engine with full TTL and cache invalidation support.
 */
export const connectRedis = async (): Promise<DriveMateRedisClient> => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    nativeClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            return false; // Stop auto-reconnect spam and fall back to in-memory
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    nativeClient.on('error', (err: any) => {
      if (!isConnectedToNativeRedis) {
        // Silently handled on initial fallback
      } else {
        console.warn('⚠️ Redis Socket Warning:', err.message || err);
      }
    });

    nativeClient.on('ready', () => {
      isConnectedToNativeRedis = true;
      console.log(`✅ Redis Connected via ${redisUrl.replace(/:[^:@]*@/, ':****@')}`);
    });

    // Attempt synchronous connection with a 3.5s timeout barrier
    await Promise.race([
      nativeClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (3500ms)')), 3500)),
    ]);

    // Wrap native Redis client to match DriveMateRedisClient interface
    activeClient = {
      isOpen: true,
      isRealRedis: true,
      get: async (k: string): Promise<string | null> => {
        const res = await nativeClient!.get(k);
        return (res as string) || null;
      },
      set: async (k: string, v: string): Promise<void> => {
        await nativeClient!.set(k, v);
      },
      setEx: async (k: string, s: number, v: string): Promise<void> => {
        await nativeClient!.setEx(k, s, v);
      },
      del: async (k: string | string[]): Promise<number> => {
        const keys = Array.isArray(k) ? k : [k];
        const res = await nativeClient!.del(keys);
        return Number(res);
      },
      exists: async (k: string): Promise<boolean> => {
        const count = await nativeClient!.exists(k);
        return count > 0;
      },
      keys: async (pattern: string): Promise<string[]> => {
        return await nativeClient!.keys(pattern);
      },
      ttl: async (k: string): Promise<number> => {
        return await nativeClient!.ttl(k);
      },
      incr: async (k: string): Promise<number> => {
        return await nativeClient!.incr(k);
      },
      expire: async (k: string, s: number): Promise<boolean> => {
        const res = await nativeClient!.expire(k, s);
        return Boolean(res);
      },
      flushAll: async (): Promise<void> => {
        await nativeClient!.flushAll();
      },
      connect: async () => {},
      disconnect: async () => {
        if (nativeClient?.isOpen) await nativeClient.disconnect();
      },
      on: (ev: string, cb: any) => nativeClient!.on(ev, cb),
      getStats: () => ({
        mode: 'redis' as const,
        totalKeys: -1,
      }),
    };

    isConnectedToNativeRedis = true;
    console.log(`🚀 Primary Redis Cache Ready (${redisUrl})`);
    return activeClient;
  } catch (err: any) {
    isConnectedToNativeRedis = false;
    activeClient = memoryEngine;
    console.log(`ℹ️ Redis Server not reachable (${err.message || 'Offline'}). Active Engine: In-Memory Redis Cache with TTL & Pattern Eviction.`);
    return activeClient;
  }
};

/**
 * Returns the current active Redis client (Native or In-Memory)
 */
export const getRedisClient = (): DriveMateRedisClient => {
  return activeClient;
};

/**
 * Returns current Redis connection and engine health
 */
export const getRedisStatus = () => {
  return {
    connected: true,
    mode: isConnectedToNativeRedis ? ('redis-server' as const) : ('in-memory-engine' as const),
    isRealRedis: isConnectedToNativeRedis,
    stats: activeClient.getStats(),
  };
};

// Export proxy object delegating to whichever client is active
const redisClient: DriveMateRedisClient = {
  get isOpen() {
    return activeClient.isOpen;
  },
  get isRealRedis() {
    return activeClient.isRealRedis;
  },
  get: (k: string) => activeClient.get(k),
  set: (k: string, v: string) => activeClient.set(k, v),
  setEx: (k: string, s: number, v: string) => activeClient.setEx(k, s, v),
  del: (k: string | string[]) => activeClient.del(k),
  exists: (k: string) => activeClient.exists(k),
  keys: (pattern: string) => activeClient.keys(pattern),
  ttl: (k: string) => activeClient.ttl(k),
  incr: (k: string) => activeClient.incr(k),
  expire: (k: string, s: number) => activeClient.expire(k, s),
  flushAll: () => activeClient.flushAll(),
  connect: () => connectRedis().then(() => {}),
  disconnect: () => activeClient.disconnect(),
  on: (ev: string, cb: any) => activeClient.on(ev, cb),
  getStats: () => activeClient.getStats(),
};

export default redisClient;
