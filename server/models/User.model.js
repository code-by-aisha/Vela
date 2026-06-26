import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [160, 'Bio cannot exceed 160 characters'],
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    aura: {
      type: String,
      enum: ['Creative Aura', 'Storyteller Aura', 'Trendsetter Aura', 'Explorer Aura', 'Visionary Aura', 'Rising Star'],
      default: 'Rising Star',
    },
    vibeScore: {
      type: Number,
      default: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ── Privacy & Message Settings ────────────────────────────────────────
    settings: {
      // Who can message this user: 'everyone' | 'followers' | 'nobody'
      allowMessagesFrom: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
      // Whether followers list is visible to others
      showFollowers:     { type: Boolean, default: true },
      // Whether following list is visible to others
      showFollowing:     { type: Boolean, default: true },
      // Whether to show online status
      showOnlineStatus:  { type: Boolean, default: true },
      // Private account — posts only visible to followers
      isPrivateAccount:  { type: Boolean, default: false },
      // Email notifications (for future use)
      emailNotifications:{ type: Boolean, default: true },
      // Push sound on notification
      notificationSound: { type: Boolean, default: true },
    },
    // ── Message Requests ────────────────────────────────────────────────
    messageRequests: [{
      from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate vibe score
userSchema.methods.calculateVibeScore = function (postCount, totalReactions) {
  const followersScore = this.followers.length * 2;
  const followingScore = this.following.length * 0.5;
  const postScore = postCount * 3;
  const reactionScore = totalReactions * 1.5;
  this.vibeScore = Math.round(followersScore + followingScore + postScore + reactionScore);
};

// Assign aura based on vibe score
userSchema.methods.assignAura = function () {
  const score = this.vibeScore;
  if (score >= 500) this.aura = 'Visionary Aura';
  else if (score >= 300) this.aura = 'Trendsetter Aura';
  else if (score >= 200) this.aura = 'Creative Aura';
  else if (score >= 100) this.aura = 'Storyteller Aura';
  else if (score >= 50) this.aura = 'Explorer Aura';
  else this.aura = 'Rising Star';
};

export default mongoose.model('User', userSchema);
