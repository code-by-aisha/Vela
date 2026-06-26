import express from 'express';
import { getMusic } from '../controllers/music.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getMusic);

export default router;
