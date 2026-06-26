import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import {
  getOrCreateConversation, getConversations, getMessages, sendMessage,
  sendMessageRequest, getMessageRequests, respondToRequest,
} from '../controllers/message.controller.js';

const router = express.Router();

router.get('/conversations',            protect, getConversations);
router.get('/requests',                 protect, getMessageRequests);
router.post('/request/:userId',         protect, sendMessageRequest);
router.put('/request/:senderId',        protect, respondToRequest);
router.post('/conversation/:userId',    protect, getOrCreateConversation);
router.get('/:conversationId',          protect, getMessages);
// uploadImage.single('image') parses multipart/form-data so req.file is populated
router.post('/:conversationId',         protect, uploadImage.single('image'), sendMessage);

export default router;
