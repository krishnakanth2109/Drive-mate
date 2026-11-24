import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const resolveBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim();
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }
  return 'http://localhost:5000';
};

const BASE_URL = resolveBaseUrl();

// Clean axios instance — no custom adapter (was crashing on Axios v1.x)
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

// Automatically attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Automatically unwrap the standard ApiResponse envelope { data: ... }
api.interceptors.response.use((response) => {
  if (response.data && response.data.data !== undefined) {
    response.data = response.data.data;
  }
  return response;
});

export const socket: Socket = io(BASE_URL!, {
  transports: ['websocket'],
  autoConnect: false,
});

export const connectSocket = async () => {
  if (!socket.connected) socket.connect();
};