import mongoose from 'mongoose';

const savedCollectionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    emoji: { type: String, default: '✨' },
    moments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Moment' }],
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('SavedCollection', savedCollectionSchema);
