import axios from 'axios';

// In dev: Vite proxy rewrites '/api' → 'http://localhost:5000/api' (see vite.config.js)
// In production (Vercel): VITE_API_URL must be set to your Railway backend URL
//   e.g. VITE_API_URL=https://vela-backend-production.up.railway.app
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,   // CRITICAL: sends the httpOnly cookie cross-domain
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isMeRequest    = url.includes('/auth/me');
    const isAuthRequest  = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');

    if (err.response?.status === 401 && !isMeRequest && !isAuthRequest) {
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
