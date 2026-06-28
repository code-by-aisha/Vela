import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const setTokenCookie = (res, token) => {
  // ALWAYS use SameSite=None + Secure in production (Railway + Vercel are different domains)
  // This is required for ANY cross-domain cookie to work in modern browsers
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('vela_token', token, {
    httpOnly: true,
    secure:   true,          // Always true — Railway serves HTTPS
    sameSite: 'none',        // Always none — cross-domain between Railway and Vercel
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/',
  });
};

export const clearTokenCookie = (res) => {
  res.clearCookie('vela_token', {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    path:     '/',
  });
};
