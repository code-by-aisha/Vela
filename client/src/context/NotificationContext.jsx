import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const toastRef = useRef(new Set());

  // Load notifications + unread count on mount / user change
  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifications([]); setLoaded(false); return; }
    Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count'),
    ]).then(([notifRes, countRes]) => {
      if (notifRes.data.success)  setNotifications(notifRes.data.notifications);
      if (countRes.data.success)  setUnreadCount(countRes.data.count);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [user?._id]);

  // Real-time: new notification arrives via socket
  useEffect(() => {
    if (!socket || !user) return;
    const handler = (notif) => {
      if (toastRef.current.has(notif._id)) return; // dedup
      toastRef.current.add(notif._id);
      setTimeout(() => toastRef.current.delete(notif._id), 10000);

      setNotifications(prev => [notif, ...prev.slice(0, 49)]);
      setUnreadCount(prev => prev + 1);

      const ICONS = { follow: '👤', reaction: '✨', comment: '💬', message: '📩' };
      toast(notif.message || 'New notification', {
        icon: ICONS[notif.type] || '🔔',
        style: {
          background: 'rgba(15,13,18,0.97)',
          border: '1px solid rgba(167,139,250,0.25)',
          color: 'white',
          fontSize: '13px',
          maxWidth: '320px',
        },
        duration: 4000,
      });
    };
    socket.on('notification:receive', handler);
    return () => socket.off('notification:receive', handler);
  }, [socket, user?._id]);

  // Mark single notification as read
  const markRead = useCallback(async (notifId) => {
    setNotifications(prev => prev.map(n => {
      if (n._id === notifId && !n.isRead) {
        setUnreadCount(c => Math.max(0, c - 1));
        return { ...n, isRead: true };
      }
      return n;
    }));
    try { await api.put(`/notifications/${notifId}/read`); } catch {}
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await api.put('/notifications/read-all'); } catch {}
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, notifications, setNotifications, markRead, markAllRead, loaded }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { unreadCount: 0, notifications: [], markRead: () => {}, markAllRead: () => {}, loaded: false };
  return ctx;
};
