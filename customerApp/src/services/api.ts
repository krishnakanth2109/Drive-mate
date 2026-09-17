import axios, { AxiosAdapter } from 'axios';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const defaultAdapter = axios.defaults.adapter as AxiosAdapter;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  adapter: async (config) => {
    if (config.method?.toLowerCase() === 'get') {
      const cacheKey = `cache_${config.url}`;
      
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          
          // Background fetch (stale-while-revalidate)
          defaultAdapter(config).then(async (response) => {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
          }).catch(e => console.log('Background fetch failed:', e));

          return {
            data: parsedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        }
        
        // No cache, proceed normally and cache result
        const response = await defaultAdapter(config);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response;
      } catch (error) {
        console.log('Cache adapter error', error);
      }
    }
    
    return defaultAdapter(config);
  }
});

// Automatically add Token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Automatically extract data from the new standard ApiResponse
api.interceptors.response.use((response) => {
  if (response.data && response.data.data !== undefined) {
    response.data = response.data.data;
  }
  return response;
});

export const socket: Socket = io(BASE_URL, {
  transports: ['websocket'],
  autoConnect: false,
});

export const connectSocket = async () => {
  if (!socket.connected) socket.connect();
};