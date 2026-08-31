import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Automatically add Token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const socket: Socket = io(BASE_URL, {
  transports: ['websocket'],
  autoConnect: false,
});

export const connectSocket = async () => {
  if (!socket.connected) socket.connect();
};