import dotenv from 'dotenv';
dotenv.config();

// MOCK REDIS CLIENT to prevent ECONNREFUSED errors
const redisClient = {
  get: async () => null,
  set: async () => {},
  setEx: async () => {},
  del: async () => {},
  isOpen: true,
  connect: async () => { console.log('Bypassing Redis Connection (Mocked)'); },
  on: () => {}
};

export const connectRedis = async () => {
  // Mock connect
  console.log('Using Mock Redis Client');
};

export default redisClient;
