import { AxiosHeaders, create } from 'axios';
import { getStoredToken } from '@/auth/tokenStorage';

let authToken: string | null = null;

export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  authToken = authToken ?? (await getStoredToken());

  if (authToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${authToken}`);
    config.headers = headers;
  }

  if (config.data instanceof FormData) {
    const headers = AxiosHeaders.from(config.headers);
    headers.delete('Content-Type');
    headers.delete('content-type');
    config.headers = headers;
  }

  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function dataOf<T>(response: { data: T }) {
  return response.data;
}
