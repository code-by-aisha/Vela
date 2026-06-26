import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api.js';
import audioManager from '../utils/audioManager.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const didFinish = useRef(false); // guard — setLoading(false) must only fire once

  const fetchMe = useCallback(async () => {
    didFinish.current = false;

    // Absolute hard deadline — app WILL show content after 3s no matter what
    const hardStop = setTimeout(() => {
      if (!didFinish.current) {
        didFinish.current = true;
        setUser(null);
        setLoading(false);
      }
    }, 3000);

    try {
      // Use AbortController so the fetch actually cancels (axios timeout can hang on proxy)
      const controller = new AbortController();
      const killSwitch = setTimeout(() => controller.abort(), 2500);

      const { data } = await api.get('/auth/me', {
        signal: controller.signal,
        timeout: 2500,
      });

      clearTimeout(killSwitch);

      if (data?.success) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
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
    if (data.success) setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    if (data.success) setUser(data.user);
    return data;
  };

  const logout = async () => {
    audioManager.stop(); // stop any playing audio before clearing auth state
    try { await api.post('/auth/logout'); } catch {}
    finally { setUser(null); }
  };

  const updateUser   = (u) => setUser(u);
  const refetchUser  = fetchMe;

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
