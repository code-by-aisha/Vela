import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: { type: String, default: '' },
    media: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', ''], default: '' },
    },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
