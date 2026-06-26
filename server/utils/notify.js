import Notification from '../models/Notification.model.js';
import { getSocketId } from '../socket/socket.js';

/**
 * Create a notification in DB and push it via socket in real-time.
 * Never throws — notification failure should never break the main action.
 */
export const pushNotification = async (io, { recipient, sender, type, moment = null, message }) => {
  try {
    // Don't notify yourself
    if (recipient.toString() === sender._id.toString()) return;

    const notif = await Notification.create({ recipient, sender: sender._id, type, moment, message });
    const populated = await notif.populate('sender', 'username profilePicture aura');

    // Push real-time via socket if recipient is online
    if (io) {
      const socketId = getSocketId(recipient.toString());
      if (socketId) {
        io.to(socketId).emit('notification:receive', populated);
      }
    }
  } catch (err) {
    console.error('pushNotification error (non-fatal):', err.message);
  }
};
