import axios, { AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getExpoHostIp = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  if (!host || host.includes('exp.direct') || host.includes('expo.dev')) return null;
  return host;
};

export const resolveBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    if (!envUrl || envUrl.startsWith('http://')) {
      return `http://${window.location.hostname}:5000`;
    }
  }

  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl.replace(/\/+$/, '');
  }

  const expoHost = getExpoHostIp();
  if (expoHost) {
    if (Platform.OS === 'android' && (expoHost === 'localhost' || expoHost === '127.0.0.1')) {
      return 'http://10.0.2.2:5000';
    }
    return `http://${expoHost}:5000`;
  }

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
};

export const BASE_URL = resolveBaseUrl();
console.log('[CustomerApp API] Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      console.warn('[CustomerApp API] Authentication required or token expired');
    }
    return Promise.reject(error);
  }
);

export function extractApiErrorMessage(err: any, fallback = 'Unable to connect to server. Please try again.'): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

/**
 * Retries idempotent GET requests on transient network/5xx errors without retrying 4xx validation errors.
 */
export async function safeGet<T = any>(url: string, config?: AxiosRequestConfig, retries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await api.get<T>(url, config);
      return res.data;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export const socket: Socket = io(BASE_URL!, {
  transports: ['websocket'],
  autoConnect: false,
});

export const connectSocket = async () => {
  if (!socket.connected) socket.connect();
};
