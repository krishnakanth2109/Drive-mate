import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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