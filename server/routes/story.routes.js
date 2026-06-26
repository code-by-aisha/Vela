import express from 'express';
import { createStory, getStoryFeed, viewStory, deleteStory, getUserStories, heartStory, getStoryHearts } from '../controllers/story.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadMedia } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/feed',              protect, getStoryFeed);
router.get('/user/:userId',      protect, getUserStories);
router.post('/',                 protect, uploadMedia.single('media'), createStory);
router.post('/:id/view',         protect, viewStory);
router.post('/:id/heart',        protect, heartStory);
router.get('/:id/hearts',        protect, getStoryHearts);
router.delete('/:id',            protect, deleteStory);

export default router;
