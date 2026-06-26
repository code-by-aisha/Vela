import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // in seconds
    genre: { type: String, default: '' },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

musicSchema.index({ title: 'text', artist: 'text' });

export default mongoose.model('Music', musicSchema);
