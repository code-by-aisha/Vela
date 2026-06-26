import Story from '../models/Story.model.js';
import User from '../models/User.model.js';
import { uploadImage, uploadVideo } from '../services/cloudinary.service.js';

const getIo = (req) => req.app.get('io');

// @desc    Create a Story
// @route   POST /api/stories
export const createStory = async (req, res) => {
  try {
    const { mood, music, text } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Media file is required for a story.' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const result = isVideo
      ? await uploadVideo(req.file.buffer, 'vela/stories')
      : await uploadImage(req.file.buffer, 'vela/stories');

    // Only store music if it has both title and audioUrl
    let parsedMusic = {};
    if (music) {
      const m = typeof music === 'string' ? JSON.parse(music) : music;
      if (m?.title && m?.audioUrl) {
        parsedMusic = {
          title:      m.title      || '',
          artist:     m.artist     || '',
          audioUrl:   m.audioUrl   || '',
          coverImage: m.coverImage || '',
          duration:   m.duration   || 0,
        };
      }
    }

    const story = await Story.create({
      author:  req.user._id,
      media:   { url: result.url, type: isVideo ? 'video' : 'image', publicId: result.publicId },
      mood:    mood || '',
      music:   parsedMusic,
      text:    text || '',
    });

    const populated = await story.populate('author', 'username profilePicture aura');

    res.status(201).json({ success: true, message: 'Story created!', story: populated });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get stories from followed users + self
// @route   GET /api/stories/feed
export const getStoryFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const userIds = [...currentUser.following, currentUser._id];

    const stories = await Story.find({ author: { $in: userIds } })
      .populate('author', 'username profilePicture aura vibeScore')
      .sort({ createdAt: -1 });

    // Group by author
    const grouped = {};
    for (const story of stories) {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = { author: story.author, stories: [], hasUnviewed: false };
      }
      grouped[authorId].stories.push(story);
      if (!story.viewers.map(v => v.toString()).includes(req.user._id.toString())) {
        grouped[authorId].hasUnviewed = true;
      }
    }

    res.json({ success: true, storyGroups: Object.values(grouped) });
  } catch (err) {
    console.error('Get story feed error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    View a Story
// @route   POST /api/stories/:id/view
export const viewStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { viewers: req.user._id } },
      { new: true }
    );
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a Story
// @route   DELETE /api/stories/:id
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await story.deleteOne();
    res.json({ success: true, message: 'Story deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get active stories for a specific user (for profile display)
// @route   GET /api/stories/user/:userId
export const getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({ author: req.params.userId })
      .populate('author', 'username profilePicture aura')
      .sort({ createdAt: -1 });
    res.json({ success: true, stories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Send a heart to a story (toggle)
// @route   POST /api/stories/:id/heart
export const heartStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate('author', '_id username');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    const userId    = req.user._id.toString();
    const authorId  = story.author._id.toString();

    // Only followers can send hearts (WhatsApp-style)
    const author = await (await import('../models/User.model.js')).default
      .findById(authorId).select('followers');
    const isFollower = author?.followers?.some(f => f.toString() === userId);
    const isOwn      = userId === authorId;

    if (!isOwn && !isFollower) {
      return res.status(403).json({ success: false, message: 'Only followers can react to stories.' });
    }

    const alreadyHearted = story.hearts.some(h => h.user.toString() === userId);

    if (alreadyHearted) {
      // Un-heart
      story.hearts = story.hearts.filter(h => h.user.toString() !== userId);
      await story.save({ validateBeforeSave: false });
      return res.json({ success: true, hearted: false, heartCount: story.hearts.length });
    } else {
      story.hearts.push({ user: req.user._id });
      await story.save({ validateBeforeSave: false });

      // Real-time — notify story author via socket
      try {
        const io  = getIo(req);
        const onlineUsers = req.app.get('onlineUsers'); // Map stored on app
        const sid = onlineUsers?.get(authorId);
        if (io && sid) {
          io.to(sid).emit('story:heart', {
            storyId:   story._id,
            sender:    { _id: req.user._id, username: req.user.username, profilePicture: req.user.profilePicture },
            heartCount: story.hearts.length,
          });
        }
      } catch {}

      return res.json({ success: true, hearted: true, heartCount: story.hearts.length });
    }
  } catch (err) {
    console.error('heartStory error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get hearts for a story (owner only)
// @route   GET /api/stories/:id/hearts
export const getStoryHearts = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('hearts.user', 'username profilePicture aura');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the author can view hearts.' });
    }
    res.json({ success: true, hearts: story.hearts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
