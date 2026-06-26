import Moment from '../models/Moment.model.js';
import { uploadVideo } from '../services/cloudinary.service.js';

// @desc    Create a Reel
// @route   POST /api/reels
export const createReel = async (req, res) => {
  try {
    const { caption, mood, tags, music } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Video file is required for a Reel.' });
    }

    const result = await uploadVideo(req.file.buffer, 'vela/reels');
    const parsedMusic = music ? (typeof music === 'string' ? JSON.parse(music) : music) : {};
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const reel = await Moment.create({
      author: req.user._id,
      caption,
      mood,
      tags: parsedTags,
      music: parsedMusic,
      media: [{ url: result.url, type: 'video', publicId: result.publicId }],
      isReel: true,
    });

    const populated = await reel.populate('author', 'username profilePicture aura vibeScore');
    res.status(201).json({ success: true, message: 'Reel uploaded! 🎬', reel: populated });
  } catch (err) {
    console.error('Create reel error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get Reels feed
// @route   GET /api/reels
export const getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Moment.find({ isReel: true })
      .populate('author', 'username profilePicture aura vibeScore')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, reels, hasMore: reels.length === limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
