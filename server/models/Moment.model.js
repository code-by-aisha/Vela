import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['beautiful', 'funny', 'love', 'fire', 'mindBlown', 'sad', 'crazy', 'wholesome', 'aesthetic', 'respect'],
    required: true,
  },
}, { _id: false });

const replySchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  replies:   [replySchema],
  createdAt: { type: Date, default: Date.now },
});

const momentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        publicId: { type: String },
      },
    ],
    mood: {
      type: String,
      enum: ['Aesthetic', 'Calm', 'Energetic', 'Thoughtful', 'Creative', 'Personal', 'Emotional', ''],
      default: '',
    },
    music: {
      title: { type: String, default: '' },
      artist: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      audioUrl: { type: String, default: '' },
      duration: { type: Number, default: 0 },
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    reactions: [reactionSchema],
    reactionCounts: {
      beautiful: { type: Number, default: 0 },
      funny: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
      mindBlown: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      crazy: { type: Number, default: 0 },
      wholesome: { type: Number, default: 0 },
      aesthetic: { type: Number, default: 0 },
      respect: { type: Number, default: 0 },
    },
    comments: [commentSchema],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isReel: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

momentSchema.index({ author: 1, createdAt: -1 });
momentSchema.index({ tags: 1 });
momentSchema.index({ 'reactions.user': 1 });

export default mongoose.model('Moment', momentSchema);
