import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api.js';
import audioManager from '../utils/audioManager.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const didFinish = useRef(false);

  const fetchMe = useCallback(async () => {
    didFinish.current = false;

    // If no token stored, don't even try — user is not logged in
    const token = localStorage.getItem('vela_token');
    if (!token) {
      didFinish.current = true;
      setUser(null);
      setLoading(false);
      return;
    }

    const hardStop = setTimeout(() => {
      if (!didFinish.current) {
        didFinish.current = true;
        setUser(null);
        setLoading(false);
      }
    }, 10000);

    try {
      const controller = new AbortController();
      const killSwitch = setTimeout(() => controller.abort(), 9000);

      const { data } = await api.get('/auth/me', {
        signal: controller.signal,
        timeout: 9000,
      });

      clearTimeout(killSwitch);

      if (data?.success) setUser(data.user);
      else {
        setUser(null);
        localStorage.removeItem('vela_token');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('vela_token');
    } finally {
      clearTimeout(hardStop);
      if (!didFinish.current) {
        didFinish.current = true;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      // Store token in localStorage for reliable cross-domain auth
      if (data.token) localStorage.setItem('vela_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    if (data.success) {
      if (data.token) localStorage.setItem('vela_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    audioManager.stop();
    localStorage.removeItem('vela_token');
    try { await api.post('/auth/logout'); } catch {}
    finally { setUser(null); }
  };

  const updateUser  = (u) => setUser(u);
  const refetchUser = fetchMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
