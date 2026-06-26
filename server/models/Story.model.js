import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    media: {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video'], required: true },
      publicId: { type: String },
    },
    mood: {
      type: String,
      enum: ['Aesthetic', 'Calm', 'Energetic', 'Thoughtful', 'Creative', 'Personal', 'Emotional', ''],
      default: '',
    },
    music: {
      title:      { type: String, default: '' },
      artist:     { type: String, default: '' },
      audioUrl:   { type: String, default: '' },
      coverImage: { type: String, default: '' },  // was missing
      duration:   { type: Number, default: 0 },   // was missing
    },
    text: { type: String, default: '', maxlength: 200 },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hearts: [{
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Story', storySchema);
