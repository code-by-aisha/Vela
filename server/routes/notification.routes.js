import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getNotifications, markAllRead, getUnreadCount, deleteNotification } from '../controllers/notification.controller.js';
import Notification from '../models/Notification.model.js';

const router = express.Router();

router.get('/',                   protect, getNotifications);
router.get('/unread-count',       protect, getUnreadCount);
router.put('/read-all',           protect, markAllRead);
router.put('/:id/read',           protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});
router.delete('/all',             protect, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});
router.delete('/:id',             protect, deleteNotification);

export default router;
