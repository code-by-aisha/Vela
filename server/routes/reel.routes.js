import express from 'express';
import { createReel, getReels } from '../controllers/reel.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadVideo } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getReels);
router.post('/', protect, uploadVideo.single('video'), createReel);

export default router;
