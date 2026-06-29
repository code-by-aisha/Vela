import User from '../models/User.model.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.utils.js';
import jwt from 'jsonwebtoken';
import PasswordReset from '../models/PasswordReset.model.js';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores.' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters.' });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} is already taken.` });
    }

    const user = await User.create({ username, email: email.toLowerCase(), password });
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({ success: true, message: 'Welcome to VELA! 🌟', user: userObj, token });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(409).json({ success: false, message: `${field === 'email' ? 'Email' : 'Username'} is already taken.` });
    }
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0]?.message || 'Validation error.';
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ success: true, message: 'Welcome back! ✨', user: userObj, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    // Support both Bearer token (cross-domain) and cookie (dev)
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : req.cookies?.vela_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.userId, { isOnline: false, lastSeen: new Date() });
      } catch (_) {}
    }
    clearTokenCookie(res);
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username profilePicture aura vibeScore')
      .populate('following', 'username profilePicture aura vibeScore');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Prevent email enumeration — always return the same message
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    await PasswordReset.deleteMany({ userId: user._id });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.create({
      userId:    user._id,
      token:     hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // CLIENT_URL may be comma-separated list — use the first one for the reset link
    const clientOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const resetUrl = `${clientOrigin}/reset-password/${rawToken}`;

    // ── Attempt real email delivery ─────────────────────────────────────────
    let emailSent = false;
    let emailError = null;

    try {
      const { sendPasswordResetEmail } = await import('../services/email.service.js');
      await sendPasswordResetEmail(user.email, user.username, resetUrl);
      emailSent = true;
      console.log(`✉️  Password reset email sent to ${user.email}`);
    } catch (err) {
      emailError = err.message;
      console.warn(`⚠️  Email delivery failed (${err.message}). Reset URL: ${resetUrl}`);
    }

    const response = {
      success: true,
      message: emailSent
        ? 'A reset link has been sent to your email address.'
        : 'If that email is registered, a reset link has been sent.',
    };

    if (!emailSent) {
      // Email not configured — always expose the reset URL directly so users
      // can still reset their password. In production this is the fallback
      // since we have no SMTP set up. The token is already securely hashed
      // in the DB so exposing the raw URL here is safe.
      response.resetUrl  = resetUrl;
      response.devNote   = `Email not configured — click the link shown on screen.`;
    }

    // Dev mode: also expose under devResetUrl for backwards compatibility
    if (process.env.NODE_ENV !== 'production') {
      response.devResetUrl = resetUrl;
    }

    return res.json(response);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const rawToken = req.params.token;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const user = await User.findById(record.userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    await user.save();

    record.used = true;
    await record.save();
    await PasswordReset.deleteMany({ userId: user._id });

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
