import Moment from '../models/Moment.model.js';
import User from '../models/User.model.js';
import { uploadImage, uploadVideo } from '../services/cloudinary.service.js';
import { pushNotification } from '../utils/notify.js';

const getIo = (req) => req.app.get('io');
const REACTION_TYPES = ['beautiful','funny','love','fire','mindBlown','sad','crazy','wholesome','aesthetic','respect'];

// Same fix as music.controller.js getMusic(): moment.music.audioUrl can be a
// relative path ('/audio/song.mp3') stored before the music library URL fix
// was deployed. Rewrite it to an absolute URL pointing at THIS server so it
// works regardless of which domain the frontend is hosted on (Vercel ≠ Railway).
const fixMomentAudioUrls = (moments, req) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const list = Array.isArray(moments) ? moments : [moments];
  list.forEach(m => {
    if (m?.music?.audioUrl?.startsWith('/audio')) {
      m.music.audioUrl = `${origin}${m.music.audioUrl}`;
    }
  });
  return moments;
};

// @desc    Create a Moment
export const createMoment = async (req, res) => {
  try {
    const { caption, mood, tags, music } = req.body;
    const mediaFiles = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');
        const result = isVideo
          ? await uploadVideo(file.buffer, 'vela/moments')
          : await uploadImage(file.buffer, 'vela/moments');
        mediaFiles.push({ url: result.url, type: isVideo ? 'video' : 'image', publicId: result.publicId });
      }
    }

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    let parsedMusic = {};
    if (music) {
      const m = typeof music === 'string' ? JSON.parse(music) : music;
      if (m?.title && m?.audioUrl) {
        parsedMusic = { title: m.title, artist: m.artist || '', audioUrl: m.audioUrl, coverImage: m.coverImage || '', duration: m.duration || 0 };
      }
    }

    const moment = await Moment.create({
      author: req.user._id,
      caption: caption || '',
      mood: mood || '',
      tags: parsedTags,
      music: parsedMusic,
      media: mediaFiles,
    });

    const populated = await moment.populate('author', 'username profilePicture aura vibeScore');

    // Update vibe score async
    User.findById(req.user._id).then(async (user) => {
      if (!user) return;
      const momentCount = await Moment.countDocuments({ author: req.user._id });
      user.calculateVibeScore?.(momentCount, 0);
      user.assignAura?.();
      await user.save({ validateBeforeSave: false });
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Moment shared! ✨', moment: populated });
  } catch (err) {
    console.error('Create moment error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Feed
export const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = [
      ...currentUser.following.map(id => id.toString()),
      req.user._id.toString(),
    ];
    const uniqueIds = [...new Set(followingIds)];

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // If user follows nobody (new account or empty follow list),
    // show ALL moments as a discovery feed — same as Explore but personalised later
    const isNewUser   = uniqueIds.length <= 1; // only themselves
    const query       = isNewUser
      ? { isReel: false }                        // show everything
      : { author: { $in: uniqueIds }, isReel: false }; // show followed + self

    const moments = await Moment.find(query)
      .populate('author', 'username profilePicture aura vibeScore')
      .populate('comments.user', 'username profilePicture aura')
      .populate('comments.replies.user', 'username profilePicture aura')
      .sort({ createdAt: -1 }).skip(skip).limit(limit);

    const total = await Moment.countDocuments(query);
    fixMomentAudioUrls(moments, req);
    res.json({ success: true, moments, total, page, pages: Math.ceil(total / limit), hasMore: skip + moments.length < total });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Explore
export const getExploreMoments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const moments = await Moment.find({ isReel: false })
      .populate('author', 'username profilePicture aura')
      .populate('comments.user', 'username profilePicture aura')
      .populate('comments.replies.user', 'username profilePicture aura')
      .sort({ views: -1, createdAt: -1 })
      .limit(limit);
    fixMomentAudioUrls(moments, req);
    res.json({ success: true, moments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Single moment
export const getMoment = async (req, res) => {
  try {
    const moment = await Moment.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate('author', 'username profilePicture aura vibeScore bio')
      .populate('comments.user', 'username profilePicture aura')
      .populate('comments.replies.user', 'username profilePicture aura');
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });
    res.json({ success: true, moment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete moment
export const deleteMoment = async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });
    if (moment.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    await moment.deleteOne();
    res.json({ success: true, message: 'Moment deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    React
export const reactToMoment = async (req, res) => {
  try {
    const { type } = req.body;
    if (!REACTION_TYPES.includes(type)) return res.status(400).json({ success: false, message: 'Invalid reaction type.' });

    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });

    const existingIdx = moment.reactions.findIndex(r => r.user.toString() === req.user._id.toString());

    if (existingIdx !== -1) {
      const existing = moment.reactions[existingIdx];
      if (existing.type === type) {
        moment.reactionCounts[type] = Math.max(0, moment.reactionCounts[type] - 1);
        moment.reactions.splice(existingIdx, 1);
      } else {
        moment.reactionCounts[existing.type] = Math.max(0, moment.reactionCounts[existing.type] - 1);
        moment.reactionCounts[type] += 1;
        moment.reactions[existingIdx].type = type;
      }
    } else {
      moment.reactions.push({ user: req.user._id, type });
      moment.reactionCounts[type] += 1;

      // Push real-time notification
      await pushNotification(getIo(req), {
        recipient: moment.author,
        sender:    req.user,
        type:      'reaction',
        moment:    moment._id,
        message:   `${req.user.username} reacted ${type === 'beautiful' ? '😍' : type === 'fire' ? '🔥' : '✨'} to your Moment.`,
      });
    }

    await moment.save();
    res.json({ success: true, reactionCounts: moment.reactionCounts, reactions: moment.reactions });
  } catch (err) {
    console.error('React error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });

    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });

    moment.comments.push({ user: req.user._id, text: text.trim() });
    await moment.save();
    await moment.populate([
      { path: 'comments.user', select: 'username profilePicture aura' },
      { path: 'comments.replies.user', select: 'username profilePicture aura' },
    ]);

    await pushNotification(getIo(req), {
      recipient: moment.author,
      sender:    req.user,
      type:      'comment',
      moment:    moment._id,
      message:   `${req.user.username} commented on your Moment: "${text.trim().slice(0, 40)}${text.length > 40 ? '…' : ''}"`,
    });

    res.json({ success: true, comments: moment.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Reply to a comment
// @route   POST /api/moments/:id/comment/:commentId/reply
export const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Reply cannot be empty.' });

    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });

    const comment = moment.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    comment.replies.push({ user: req.user._id, text: text.trim() });
    await moment.save();
    await moment.populate([
      { path: 'comments.user',         select: 'username profilePicture aura' },
      { path: 'comments.replies.user', select: 'username profilePicture aura' },
    ]);

    // Notify original comment author (not the moment author — they get a separate notif)
    const commentAuthorId = comment.user?.toString?.() || comment.user;
    if (commentAuthorId !== req.user._id.toString()) {
      await pushNotification(getIo(req), {
        recipient: comment.user,
        sender:    req.user,
        type:      'reply',
        moment:    moment._id,
        commentId: comment._id,
        message:   `${req.user.username} replied to your comment: "${text.trim().slice(0, 40)}${text.length > 40 ? '…' : ''}"`,
      });
    }

    res.json({ success: true, comments: moment.comments });
  } catch (err) {
    console.error('addReply error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Save/Unsave
export const toggleSave = async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ success: false, message: 'Moment not found.' });
    const isSaved = moment.savedBy.includes(req.user._id);
    if (isSaved) moment.savedBy.pull(req.user._id);
    else moment.savedBy.addToSet(req.user._id);
    await moment.save();
    res.json({ success: true, saved: !isSaved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Saved moments
export const getSavedMoments = async (req, res) => {
  try {
    const moments = await Moment.find({ savedBy: req.user._id })
      .populate('author', 'username profilePicture aura')
      .sort({ createdAt: -1 });
    fixMomentAudioUrls(moments, req);
    res.json({ success: true, moments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
