import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isMeRequest = url.includes('/auth/me');
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');

    // Only auto-redirect on 401 for non-auth, non-me endpoints
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
