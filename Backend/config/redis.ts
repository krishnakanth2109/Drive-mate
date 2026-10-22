import dotenv from 'dotenv';
dotenv.config();

export interface MockRedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  setEx: (key: string, seconds: number, value: string) => Promise<void>;
  del: (key: string) => Promise<void>;
  isOpen: boolean;
  connect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
}

// MOCK REDIS CLIENT to prevent ECONNREFUSED errors in development/testing
const redisClient: MockRedisClient = {
  get: async () => null,
  set: async () => {},
  setEx: async () => {},
  del: async () => {},
  isOpen: true,
  connect: async () => {
    console.log('Bypassing Redis Connection (Mocked)');
  },
  on: () => {},
};

export const connectRedis = async (): Promise<void> => {
  console.log('Using Mock Redis Client');
};

export default redisClient;
