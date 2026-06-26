import express from 'express';
import { search, getTrendingTags } from '../controllers/search.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, search);
router.get('/trending-tags', protect, getTrendingTags);

export default router;
