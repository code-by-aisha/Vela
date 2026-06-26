import express from 'express';
import {
  createMoment, getFeed, getExploreMoments, getMoment,
  deleteMoment, reactToMoment, addComment, addReply, toggleSave, getSavedMoments
} from '../controllers/moment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadMedia } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/feed',                              protect, getFeed);
router.get('/explore',                           protect, getExploreMoments);
router.get('/saved',                             protect, getSavedMoments);
router.get('/:id',                               protect, getMoment);
router.post('/',                                 protect, uploadMedia.array('media', 10), createMoment);
router.delete('/:id',                            protect, deleteMoment);
router.post('/:id/react',                        protect, reactToMoment);
router.post('/:id/comment',                      protect, addComment);
router.post('/:id/comment/:commentId/reply',     protect, addReply);
router.post('/:id/save',                         protect, toggleSave);

export default router;
