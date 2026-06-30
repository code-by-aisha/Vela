import axios from 'axios';

// In dev: Vite proxy rewrites '/api' → 'http://localhost:5000/api'
// In production: VITE_API_URL must be set to your Railway backend URL
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  // NOTE: No default Content-Type header here.
  // Axios auto-sets 'application/json' for plain objects and
  // 'multipart/form-data; boundary=...' for FormData automatically.
  // A hardcoded default here breaks file uploads (profile picture, cover
  // photo, moments with media) because it overrides the auto-generated
  // multipart boundary, causing the server's multer parser to fail with 500.
  timeout: 15000,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vela_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only set JSON content-type for plain object bodies — never for FormData
  if (config.data && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
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
