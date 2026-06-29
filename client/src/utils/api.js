import axios from 'axios';

// In dev: Vite proxy rewrites '/api' → 'http://localhost:5000/api'
// In production: VITE_API_URL must be set to your Railway backend URL
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token from localStorage to every request
// This is the reliable cross-domain auth method (Vercel ↔ Railway)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vela_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isMeRequest   = url.includes('/auth/me');
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');

    if (err.response?.status === 401 && !isMeRequest && !isAuthRequest) {
      localStorage.removeItem('vela_token');
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
