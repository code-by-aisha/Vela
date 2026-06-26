import { Message, Conversation } from '../models/Message.model.js';
import User from '../models/User.model.js';
import { uploadImage } from '../services/cloudinary.service.js';
import { pushNotification } from '../utils/notify.js';

const getIo = (req) => req.app.get('io');

// ─── Helper: check if two users can chat ────────────────────────────────────
const canMessage = async (senderId, recipientId) => {
  const recipient = await User.findById(recipientId).select('settings followers messageRequests');
  if (!recipient) return { allowed: false, reason: 'User not found.' };

  const pref = recipient.settings?.allowMessagesFrom || 'everyone';
  if (pref === 'nobody') return { allowed: false, reason: 'This user is not accepting messages.' };

  const isFollower = recipient.followers.map(f => f.toString()).includes(senderId.toString());

  if (pref === 'followers' && !isFollower) {
    return { allowed: false, reason: 'This user only accepts messages from followers.', needRequest: true };
  }

  return { allowed: true, recipient, isFollower };
};

// @desc    Send a message request (when not allowed to message directly)
// @route   POST /api/messages/request/:userId
export const sendMessageRequest = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const senderId = req.user._id;

    if (recipientId === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself.' });
    }

    const recipient = await User.findById(recipientId).select('settings messageRequests username');
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found.' });

    // Enforce privacy — nobody pref blocks even requests
    const pref = recipient.settings?.allowMessagesFrom || 'everyone';
    if (pref === 'nobody') {
      return res.status(403).json({ success: false, message: 'This user is not accepting messages or requests.' });
    }

    // Check if request already exists
    const existing = recipient.messageRequests.find(r => r.from.toString() === senderId.toString());
    if (existing) {
      return res.status(409).json({ success: false, message: `Request already ${existing.status}.`, status: existing.status });
    }

    recipient.messageRequests.push({ from: senderId, status: 'pending' });
    await recipient.save({ validateBeforeSave: false });

    // Notify recipient
    await pushNotification(getIo(req), {
      recipient: recipientId,
      sender:    req.user,
      type:      'message',
      message:   `${req.user.username} sent you a message request.`,
    });

    res.json({ success: true, message: 'Message request sent!' });
  } catch (err) {
    console.error('Send message request error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get my message requests (incoming)
// @route   GET /api/messages/requests
export const getMessageRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('messageRequests.from', 'username profilePicture aura vibeScore');
    const requests = user.messageRequests.filter(r => r.status === 'pending');
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Respond to a message request
// @route   PUT /api/messages/request/:senderId
export const respondToRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const senderId = req.params.senderId;

    const user = await User.findById(req.user._id);
    const reqIdx = user.messageRequests.findIndex(r => r.from.toString() === senderId);
    if (reqIdx === -1) return res.status(404).json({ success: false, message: 'Request not found.' });

    user.messageRequests[reqIdx].status = action === 'accept' ? 'accepted' : 'rejected';
    await user.save({ validateBeforeSave: false });

    if (action === 'accept') {
      // Create conversation
      let conv = await Conversation.findOne({ participants: { $all: [req.user._id, senderId] } });
      if (!conv) {
        conv = await Conversation.create({ participants: [req.user._id, senderId] });
      }
      await conv.populate('participants', 'username profilePicture aura isOnline lastSeen');

      // Notify sender that request was accepted
      await pushNotification(getIo(req), {
        recipient: senderId,
        sender:    req.user,
        type:      'message',
        message:   `${req.user.username} accepted your message request. You can now chat!`,
      });

      return res.json({ success: true, message: 'Request accepted!', conversation: conv });
    }

    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) {
    console.error('Respond to request error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get or create conversation (with permission check)
// @route   POST /api/messages/conversation/:userId
export const getOrCreateConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself.' });
    }

    // Check if conversation already exists — use $all without $size to avoid type issues,
    // then filter in JS to ensure exactly 2 participants (no group chats accidentally matched).
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    }).populate('participants', 'username profilePicture aura isOnline lastSeen settings')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } });

    if (conversation) {
      return res.json({ success: true, conversation });
    }

    // Check permission
    const { allowed, reason, needRequest, recipient } = await canMessage(currentUserId, otherUserId);

    if (!allowed) {
      // Check if accepted request exists
      const recipientUser = await User.findById(otherUserId).select('messageRequests');
      const accepted = recipientUser?.messageRequests.find(r =>
        r.from.toString() === currentUserId.toString() && r.status === 'accepted'
      );
      if (!accepted) {
        return res.status(403).json({ success: false, message: reason, needRequest: !!needRequest });
      }
    }

    // Create new conversation
    conversation = await Conversation.create({ participants: [currentUserId, otherUserId] });
    conversation = await conversation.populate('participants', 'username profilePicture aura isOnline lastSeen');

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('Get/create conversation error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all conversations
// @route   GET /api/messages/conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username profilePicture aura isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
      .sort({ lastMessageAt: -1 });
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get messages in conversation
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip  = (page - 1) * limit;

    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id });
    if (!conversation) return res.status(403).json({ success: false, message: 'Access denied.' });

    const messages = await Message.find({ conversation: conversationId, isDeleted: false })
      .populate('sender', 'username profilePicture')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit);

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, seenBy: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Send message
// @route   POST /api/messages/:conversationId
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, replyToId } = req.body;

    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id });
    if (!conversation) return res.status(403).json({ success: false, message: 'Access denied.' });

    let mediaData = {};
    if (req.file) {
      const result = await uploadImage(req.file.buffer, 'vela/messages');
      mediaData = { url: result.url, type: 'image' };
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text || '',
      media: mediaData,
      seenBy: [req.user._id],
      replyTo: replyToId || null,
    });

    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, lastMessageAt: new Date() });

    const populated = await message.populate([
      { path: 'sender', select: 'username profilePicture aura' },
      { path: 'replyTo', populate: { path: 'sender', select: 'username' } },
    ]);

    // Real-time delivery
    const io = getIo(req);
    if (io) {
      const payload = { ...populated.toObject(), conversationId };

      // 1. Deliver to everyone already in the conversation room (open chat)
      io.to(`conv:${conversationId}`).emit('message:receive', payload);

      // 2. Also deliver directly to each recipient's personal socket so they
      //    receive the badge + popup even when they haven't joined the room
      //    (i.e. they are on another page or just came back online).
      const onlineUsers = req.app.get('onlineUsers');
      if (onlineUsers) {
        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== req.user._id.toString()
        );
        for (const recipientId of otherParticipants) {
          const recipientSocketId = onlineUsers.get(recipientId.toString());
          if (recipientSocketId) {
            // Don't double-deliver if they're already in the room
            io.to(recipientSocketId).emit('message:receive', payload);
          }
        }
      }
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
