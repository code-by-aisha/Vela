import User from '../models/User.model.js';
import jwt  from 'jsonwebtoken';

const onlineUsers = new Map(); // userId → socketId

export const initSocket = (io, app) => {
  // ── Auth middleware — reject unauthenticated socket connections ──────────
  io.use(async (socket, next) => {
    try {
      // Primary: Bearer token sent via handshake auth (cross-domain — Vercel→Railway)
      let token = socket.handshake.auth?.token;

      // Fallback: cookie (works only same-domain / dev)
      if (!token) {
        const raw = socket.handshake.headers?.cookie || '';
        const match = raw.match(/vela_token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId?.toString();
      if (!socket.userId) return next(new Error('Unauthorized'));
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // Make the map available to controllers via req.app.get('onlineUsers')
  if (app) app.set('onlineUsers', onlineUsers);

  io.on('connection', (socket) => {

    socket.on('user:online', async (userId) => {
      if (!userId) return;
      const uid = userId.toString();
      onlineUsers.set(uid, socket.id);
      socket.userId = uid;

      try {
        const user = await User.findByIdAndUpdate(
          uid,
          { isOnline: true, lastSeen: new Date() },
          { new: true }
        ).select('settings');

        // Only advertise online to others if privacy allows it
        const visible = user?.settings?.showOnlineStatus !== false;
        io.emit('user:status', { userId: uid, isOnline: visible, lastSeen: new Date() });
      } catch {
        io.emit('user:status', { userId: uid, isOnline: true, lastSeen: new Date() });
      }
    });

    socket.on('conversation:join',  (convId) => { if (convId) socket.join(`conv:${convId}`); });
    socket.on('conversation:leave', (convId) => { if (convId) socket.leave(`conv:${convId}`); });

    socket.on('message:send', (data) => {
      if (!data?.conversationId) return;
      socket.to(`conv:${data.conversationId}`).emit('message:receive', data);
    });

    socket.on('typing:start', (data) => {
      if (!data?.conversationId) return;
      socket.to(`conv:${data.conversationId}`).emit('typing:start', { userId: data.userId });
    });
    socket.on('typing:stop', (data) => {
      if (!data?.conversationId) return;
      socket.to(`conv:${data.conversationId}`).emit('typing:stop', { userId: data.userId });
    });

    socket.on('message:seen', (data) => {
      if (!data?.conversationId) return;
      socket.to(`conv:${data.conversationId}`).emit('message:seen', { userId: data.userId });
    });

    socket.on('notification:send', (data) => {
      if (!data?.recipientId) return;
      const sid = onlineUsers.get(data.recipientId.toString());
      if (sid) io.to(sid).emit('notification:receive', data);
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        const lastSeen = new Date();
        onlineUsers.delete(socket.userId);
        // Always broadcast offline — regardless of privacy (user actually left)
        io.emit('user:status', { userId: socket.userId, isOnline: false, lastSeen });
        try { await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen }); } catch {}
      }
    });
  });
};

export const getSocketId = (userId) => userId ? onlineUsers.get(userId.toString()) : null;
