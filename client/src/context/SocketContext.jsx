import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Send Bearer token in socket handshake so server can auth the socket connection
    const token = localStorage.getItem('vela_token');

    const s = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('user:online', user._id);
    });

    s.on('disconnect', () => setIsConnected(false));
    s.on('connect_error', (err) => console.warn('Socket error:', err.message));

    s.on('user:status', ({ userId, isOnline }) => {
      setOnlineUsers(prev =>
        isOnline ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId)
      );
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
