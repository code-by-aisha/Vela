import User from '../models/User.model.js';
import { uploadImage } from '../services/cloudinary.service.js';
import { pushNotification } from '../utils/notify.js';

// io is attached to app in index.js
const getIo = (req) => req.app.get('io');

// @desc    Get current user profile
// @route   GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username profilePicture aura vibeScore')
      .populate('following', 'username profilePicture aura vibeScore');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('updateProfile error:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// @desc    Get user by username
// @route   GET /api/users/:username
export const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username profilePicture aura vibeScore')
      .populate('following', 'username profilePicture aura vibeScore')
      .select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isOwn = req.user?._id?.toString() === user._id.toString();
    const Moment = (await import('../models/Moment.model.js')).default;
    const momentCount = await Moment.countDocuments({ author: user._id, isReel: false });

    const userObj = user.toObject();

    if (!isOwn) {
      // Keep real counts for TikTok-style privacy but clear the list
      if (userObj.settings?.showFollowers === false) {
        userObj.followersCount  = userObj.followers.length; // preserve the real count
        userObj.followers       = [];                        // hide the actual list
        userObj.followersHidden = true;
      }
      if (userObj.settings?.showFollowing === false) {
        userObj.followingCount  = userObj.following.length;
        userObj.following       = [];
        userObj.followingHidden = true;
      }
      // Respect online status privacy — appear offline to others if disabled
      if (userObj.settings?.showOnlineStatus === false) {
        userObj.isOnline = false;
      }
    }

    res.json({ success: true, user: userObj, momentCount });
  } catch (err) {
    console.error('getUserByUsername error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile/update
export const updateProfile = async (req, res) => {
  try {
    const { bio, username } = req.body;
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;

    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (exists) return res.status(409).json({ success: false, message: 'Username already taken.' });
      updateData.username = username;
    }

    // uploadImage.fields() places files in req.files[fieldName][0]
    const profileFile = req.files?.profilePicture?.[0];
    const coverFile   = req.files?.coverPhoto?.[0];

    if (profileFile) {
      try {
        const { uploadProfilePicture } = await import('../services/cloudinary.service.js');
        const result = await uploadProfilePicture(profileFile.buffer);
        updateData.profilePicture = result.url;
      } catch (uploadErr) {
        console.error('Cloudinary profile upload failed:', uploadErr.message);
        return res.status(502).json({ success: false, message: 'Image upload failed. Check Cloudinary configuration.' });
      }
    }

    if (coverFile) {
      try {
        const result = await uploadImage(coverFile.buffer, 'vela/covers');
        updateData.coverPhoto = result.url;
      } catch (uploadErr) {
        console.error('Cloudinary cover upload failed:', uploadErr.message);
        return res.status(502).json({ success: false, message: 'Image upload failed. Check Cloudinary configuration.' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password')
     .populate('followers', 'username profilePicture aura vibeScore')
     .populate('following', 'username profilePicture aura vibeScore');

    res.json({ success: true, user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Follow / Unfollow
// @route   POST /api/users/:id/follow
export const toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const isFollowing = targetUser.followers.map(f => f.toString()).includes(currentUserId.toString());

    if (isFollowing) {
      await User.findByIdAndUpdate(targetId,   { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });
      return res.json({ success: true, following: false, message: 'Unfollowed.' });
    } else {
      await User.findByIdAndUpdate(targetId,   { $addToSet: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });

      // Push notification — real-time via socket + save to DB
      await pushNotification(getIo(req), {
        recipient: targetId,
        sender:    req.user,
        type:      'follow',
        message:   `${req.user.username} started following you.`,
      });

      return res.json({ success: true, following: true, message: 'Following!' });
    }
  } catch (err) {
    console.error('Toggle follow error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggestions
export const getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excluded = [...currentUser.following, currentUser._id];
    const users = await User.find({ _id: { $nin: excluded } })
      .select('username profilePicture aura vibeScore bio followers')
      .sort({ vibeScore: -1 })
      .limit(8);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get followers
// @route   GET /api/users/:id/followers
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePicture aura vibeScore');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, users: user.followers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get following
// @route   GET /api/users/:id/following
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePicture aura vibeScore');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, users: user.following });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Aliases / missing exports expected by routes
export const getUserProfile = getUserByUsername;

// @desc    Get moments by username
// @route   GET /api/users/:username/moments
export const getUserMoments = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const Moment = (await import('../models/Moment.model.js')).default;
    const moments = await Moment.find({ author: user._id, isReel: false })
      .populate('author', 'username profilePicture aura')
      .sort({ createdAt: -1 })
      .limit(30);

    // Fix relative /audio paths the same way moment.controller.js does —
    // stored music URLs from before the cross-domain fix need rewriting.
    const origin = `${req.protocol}://${req.get('host')}`;
    moments.forEach(m => {
      if (m?.music?.audioUrl?.startsWith('/audio')) {
        m.music.audioUrl = `${origin}${m.music.audioUrl}`;
      }
    });

    res.json({ success: true, moments });
  } catch (err) {
    console.error('getUserMoments error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Alias for suggested users (routes use getSuggestedUsers in some places)
export const getSuggestedUsers = getSuggestions;
