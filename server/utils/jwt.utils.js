import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const setTokenCookie = (res, token) => {
  res.cookie('vela_token', token, {
    httpOnly: true,
    // CRITICAL FIX: cross-domain (Railway ↔ Vercel) requires:
    //   secure: true  — cookie only sent over HTTPS
    //   sameSite: 'none' — allows cross-site requests (Vercel → Railway)
    // In dev: secure:false + sameSite:'lax' (localhost, same origin via proxy)
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/',
  });
};

export const clearTokenCookie = (res) => {
  res.clearCookie('vela_token', {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    path:     '/',
  });
};
