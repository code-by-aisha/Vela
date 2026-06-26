import User from '../models/User.model.js';
import Moment from '../models/Moment.model.js';

// @desc    Search users and moments
// @route   GET /api/search?q=...&type=users|moments|all
export const search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const query = q.trim();
    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } },
        ],
      })
        .select('username profilePicture aura vibeScore bio followers')
        .limit(10);
    }

    if (type === 'all' || type === 'moments') {
      results.moments = await Moment.find({
        $or: [
          { caption: { $regex: query, $options: 'i' } },
          { tags: { $in: [query.toLowerCase()] } },
        ],
        isReel: false,
      })
        .populate('author', 'username profilePicture aura')
        .sort({ views: -1, createdAt: -1 })
        .limit(12);
    }

    if (type === 'all' || type === 'tags') {
      const tagMoments = await Moment.find({ tags: query.toLowerCase() })
        .populate('author', 'username profilePicture aura')
        .limit(12);
      results.tags = tagMoments;
    }

    res.json({ success: true, query, results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Trending tags
// @route   GET /api/search/trending-tags
export const getTrendingTags = async (req, res) => {
  try {
    const tags = await Moment.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
