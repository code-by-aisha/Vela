// dotenv MUST be the very first import in ESM.
// All `import` statements are hoisted and evaluated before any top-level code
// runs — so dotenv.config() in the body fires too late for other modules that
// read process.env during initialisation.
import 'dotenv/config';

import express   from 'express';
import http      from 'http';
import { Server } from 'socket.io';
import mongoose  from 'mongoose';
import cookieParser from 'cookie-parser';
import cors      from 'cors';
import helmet    from 'helmet';
import rateLimit from 'express-rate-limit';
import path      from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import { initSocket }      from './socket/socket.js';
import authRoutes          from './routes/auth.routes.js';
import userRoutes          from './routes/user.routes.js';
import momentRoutes        from './routes/moment.routes.js';
import storyRoutes         from './routes/story.routes.js';
import messageRoutes       from './routes/message.routes.js';
import notificationRoutes  from './routes/notification.routes.js';
import searchRoutes        from './routes/search.routes.js';
import reelRoutes          from './routes/reel.routes.js';
import musicRoutes         from './routes/music.routes.js';
import { seedMusic }       from './controllers/music.controller.js';

// ── Validate required env vars ───────────────────────────────────────────────
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing env vars: ${missing.join(', ')}`);
  console.error('    → Make sure server/.env exists with all required keys\n');
  process.exit(1);
}

// Refuse production startup with placeholder or weak JWT secret
const _jwt = process.env.JWT_SECRET || '';
if (process.env.NODE_ENV === 'production' &&
    (_jwt.length < 32 || _jwt.includes('REPLACE_ME') || _jwt.includes('change_in_production') || _jwt.includes('super_secret'))) {
  console.error('\n❌  JWT_SECRET is too weak for production.');
  console.error('    Run:  npm run generate-secret\n');
  process.exit(1);
}

const app    = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT       = process.env.PORT        || 5000;
const isProd     = process.env.NODE_ENV === 'production';

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: CLIENT_URL, credentials: true } });
initSocket(io, app);
app.set('io', io); // so controllers can do req.app.get('io')

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"],   // needed for Vite HMR in dev
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://res.cloudinary.com', 'https://i.pravatar.cc'],
      mediaSrc:       ["'self'", 'blob:', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'",
        // WebSocket — derive from CLIENT_URL in prod, allow localhost in dev
        isProd
          ? (process.env.CLIENT_URL || '').replace(/^https?/, 'wss')
          : 'ws://localhost:5000',
        isProd
          ? (process.env.CLIENT_URL || '').replace(/^https?/, 'wss')
          : 'wss://localhost:5000',
        process.env.CLIENT_URL || '',
      ],
      workerSrc:      ["'self'", 'blob:'],
      objectSrc:      ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes.' },
  skip: () => !isProd,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: () => !isProd,
});

app.use('/api/auth', authLimiter);
app.use('/api',      apiLimiter);

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));        // was 50mb — tightened
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Serve local audio files with CORS headers ─────────────────────────────────
app.use('/audio', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'public', 'audio')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'VELA API running ✨',
    db: states[mongoose.connection.readyState] ?? 'unknown',
    ts: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/moments',       momentRoutes);
app.use('/api/stories',       storyRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/reels',         reelRoutes);
app.use('/api/music',         musicRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) =>
  res.status(404).json({ success: false, message: 'Endpoint not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal server error.' : (err.message || 'Server error'),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected');

    // Seed music — fire-and-forget, never crashes server
    seedMusic().catch(e => console.warn('⚠️  Music seed warning:', e.message));

    server.listen(PORT, () => console.log(`🚀 VELA API → http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('\n   MongoDB is not running at:', process.env.MONGO_URI);
      console.error('   ► Windows: open Services → start "MongoDB"');
      console.error('   ► Or run:  mongod --dbpath C:\\data\\db\n');
    }
    process.exit(1);
  }
};

start();
