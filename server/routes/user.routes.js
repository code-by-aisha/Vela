import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getUserProfile, getUserMoments, updateProfile, toggleFollow, getSuggestions, getFollowers, getFollowing } from '../controllers/user.controller.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import User from '../models/User.model.js';

const router = express.Router();

router.get('/suggested', protect, getSuggestions);
router.get('/:username', protect, getUserProfile);
router.get('/:username/moments', protect, getUserMoments);
router.put('/profile/update', protect, uploadImage.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), updateProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);

// Update privacy / notification settings
router.put('/settings/privacy', protect, async (req, res) => {
  try {
    const allowed = ['allowMessagesFrom','showFollowers','showFollowing','showOnlineStatus','isPrivateAccount','emailNotifications','notificationSound'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[`settings.${key}`] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
