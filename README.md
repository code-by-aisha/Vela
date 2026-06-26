# VELA — Share Your Vibe 🌀

> A full-stack social media platform built for creators, storytellers, and vibe-seekers.
> Dark glassmorphic design · Real-time messaging · Music-attached moments · Aura identity system.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How the App Works](#how-the-app-works)
4. [Feature Systems](#feature-systems)
5. [Music System](#music-system)
6. [Security Architecture](#security-architecture)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Adding Songs](#adding-songs)
10. [Production Deployment](#production-deployment)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework (Vite bundler) |
| **React Router v6** | Client-side routing |
| **Framer Motion** | Animations and transitions |
| **Socket.IO Client** | Real-time messaging, notifications, presence |
| **Axios** | HTTP API calls |
| **React Hot Toast** | Notification toasts |
| **React Icons (HI)** | Icon library |
| **Bootstrap 5** | Grid/utility CSS (minimal use) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **Socket.IO** | WebSocket server for real-time features |
| **MongoDB + Mongoose** | Database + ODM |
| **bcryptjs** | Password hashing (salt rounds: 12) |
| **jsonwebtoken** | JWT authentication (7-day tokens) |
| **Multer** | File upload handling (memory storage) |
| **Cloudinary SDK v2** | Image/video cloud storage |
| **Nodemailer** | Password reset emails |
| **Helmet** | HTTP security headers + CSP |
| **express-rate-limit** | API rate limiting |
| **dotenv** | Environment variable management |
| **nodemon** | Dev server auto-restart |

### Infrastructure / Services
| Service | Purpose |
|---------|---------|
| **MongoDB** | Primary database (local or Atlas) |
| **Cloudinary** | Profile pictures, post media, story media |
| **Local `/public/audio`** | Self-hosted music files (MP3/WAV) |
| **SMTP (Gmail/SendGrid)** | Forgot password emails |

---

## Project Structure

```
VELA/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # LoadingScreen, MusicPlayer, MusicSelector
│   │   │   ├── feed/           # MomentCard, CreateMomentModal, ReactionPicker
│   │   │   ├── layout/         # Sidebar, MobileNav, AppLayout, RightSidebar
│   │   │   ├── profile/        # FollowersModal
│   │   │   └── stories/        # StoriesBar (viewer + hearts)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User session, login/register/logout
│   │   │   ├── SocketContext.jsx       # Socket.IO connection + online users set
│   │   │   ├── NotificationContext.jsx # Real-time notification badge
│   │   │   └── MessageContext.jsx      # Unread message count + toast popups
│   │   ├── pages/              # One file per route
│   │   ├── utils/api.js        # Axios instance with credentials + interceptors
│   │   └── index.css           # CSS variables, global styles, animations
│   └── vite.config.js          # Dev server + API/audio proxy config
│
├── server/                     # Express backend
│   ├── controllers/            # Business logic per domain
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT cookie verification
│   │   └── upload.middleware.js # Multer + Cloudinary upload presets
│   ├── services/
│   │   ├── cloudinary.service.js  # Upload helpers (image, video, profile)
│   │   └── email.service.js       # Nodemailer password reset emails
│   ├── socket/socket.js           # Socket.IO event handlers
│   ├── utils/
│   │   ├── jwt.utils.js            # Token generation + secure cookie helpers
│   │   └── notify.js               # Push notification helper
│   ├── scripts/
│   │   ├── add-track.js            # CLI: add one song to DB
│   │   └── scan-audio.js           # CLI: auto-import all files in /public/audio
│   ├── public/audio/               # Self-hosted MP3/WAV files
│   ├── .env                        # Environment variables (never commit)
│   └── index.js                    # Server entry point
```

---

## How the App Works

### Authentication Flow
1. User registers → password bcrypt-hashed (12 rounds) → JWT created → stored as `httpOnly` cookie
2. Every API request sends cookie automatically (`withCredentials: true`)
3. `protect` middleware verifies JWT on every protected route
4. `AuthContext` fetches `/auth/me` on app load (3s hard timeout) → sets user state
5. Logout clears the cookie server-side

### Real-Time Architecture (Socket.IO)
```
Client connects → emits 'user:online' (userId)
Server stores   → onlineUsers Map (userId → socketId)
Server emits    → 'user:status' { userId, isOnline } to all clients
                  (respects showOnlineStatus privacy setting)

Messages   → join conversation room → emit to room only
Typing     → 'typing:start' / 'typing:stop' events
Reactions  → notification:send → specific user's socket
Stories    → 'story:heart' event → story author's socket
```

### Data Flow — Creating a Moment
1. User opens `CreateMomentModal` → selects media + music + mood + tags
2. `MusicSelector` → user picks track → optionally clips it (start/end time)
3. POST `/api/moments` with `multipart/form-data` → Multer → Cloudinary
4. New moment dispatched via `window.dispatchEvent('vela:moment-created')`
5. `FeedPage` listens → prepends moment instantly (no refresh)

---

## Feature Systems

### Aura System
Each user has an **Aura Level** based on their `vibeScore`:
| Level | Score | Emoji |
|-------|-------|-------|
| Rising Star | 0–14 | ⭐ |
| Explorer Aura | 15–37 | 🔍 |
| Storyteller Aura | 38–54 | 📖 |
| Creative Aura | 55–77 | 🎨 |
| Visionary Aura | 78+ | 🌀 |

Vibe score increases with: posting moments, receiving reactions, getting follows, attaching music.

### Messaging System
- **Privacy gates:** Users with `allowMessagesFrom: 'nobody'` cannot receive messages or requests
- **Message Requests:** First contact creates a request → recipient Accept/Decline
- **Accepted → Conversation:** Full chat with typing indicators, image attachments, reply threads
- **Reply system (WhatsApp-style):** Hover a message → reply icon → quoted preview in new message → click to scroll to original
- **Unread badges:** Purple badge on Sidebar + MobileNav, updated in real-time via socket
- **Notifications:** Browser push notification + Web Audio API ping sound

### Stories System
- Stories expire after 24 hours (server-side `expiresAt` field)
- Only followers can heart a story (privacy enforced on backend)
- Hearts are real-time — author receives socket event immediately
- Owners can tap the heart icon to see who hearted their story
- Stories support background music (plays automatically when opened)

### Notifications
- Real-time via Socket.IO `notification:receive` event
- Unread count badge on bell icon
- Marking a notification read decrements count (prevents double-decrement via `isRead` check)
- Types: follow, like, comment, reaction, message_request, story_heart

### Privacy Settings
| Setting | Effect |
|---------|--------|
| `showOnlineStatus: false` | Green dot never shown to others; socket broadcasts `isOnline: false` |
| `showFollowers: false` | Follower count visible, but list hidden (TikTok-style) |
| `showFollowing: false` | Following count visible, but list hidden |
| `allowMessagesFrom: 'nobody'` | Blocks all messages AND requests |

---

## Music System

### Architecture
All music is **self-hosted** in `server/public/audio/`. No external CDN is used (all public CDNs block hotlinking with 403).

### Clip/Trim System
Users can set **start time** and **end time** for any track:
1. Open Music Selector → click ✂️ scissors icon on any track
2. Visual timeline shows the full track with a highlighted clip region
3. Drag **Start** slider to set where playback begins
4. Drag **End** slider to set where playback stops (max 60s clip)
5. Quick presets: 15s / 30s / 45s / 60s / Full track
6. Preview the exact clip before attaching
7. Attached music on a Moment/Story respects `startTime` and `endTime`

### Adding Your Own Songs
```bash
# Option 1 — Single track
# 1. Drop file into server/public/audio/
# 2. Edit server/scripts/add-track.js with title, artist, genre, audioUrl
npm run add-track

# Option 2 — Bulk import
# Drop all files into server/public/audio/
npm run scan-audio
# Then edit titles/artists in MongoDB
```

---

## Security Architecture

### Applied Protections
| Layer | Protection |
|-------|-----------|
| **Cookies** | `httpOnly`, `secure` (prod), `sameSite: 'lax'`, 7-day expiry |
| **Passwords** | bcrypt with 12 salt rounds |
| **JWT** | HS256, 7-day expiry, verified on every request |
| **Headers** | Helmet: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **CSP** | Content-Security-Policy restricts scripts/styles/media to known origins |
| **Rate limiting** | Auth: 20 req/15min · API: 300 req/15min (production only) |
| **CORS** | Strict origin whitelist (`CLIENT_URL` env var only) |
| **Input validation** | Username regex, password length, email format on register |
| **NoSQL injection** | Mongoose schema typing + no `$where` queries |
| **File uploads** | Multer memory storage → Cloudinary (no disk write), MIME type checked |
| **Error messages** | No stack traces in production responses |
| **Privacy** | Online status, followers/following list gated by user settings |

### Known Considerations for Production
- Set `NODE_ENV=production` in `.env`
- Use MongoDB Atlas with IP allowlist
- Set a strong 32+ char `JWT_SECRET`
- Configure SMTP for real password reset emails
- Use HTTPS (Nginx reverse proxy recommended)
- Consider Redis for Socket.IO scaling if deploying multiple instances

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### Installation

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
```

### Environment Setup
Copy and fill in `server/.env` (see below).

### Running in Development
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```
Open: http://localhost:5173

---

## Environment Variables

Create `server/.env`:

```env
# ── Core ──────────────────────────────────────────────────────
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vela
JWT_SECRET=change-this-to-a-random-32-char-string-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# ── Cloudinary ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email / SMTP (for Forgot Password) ────────────────────────
# Gmail option (create App Password at myaccount.google.com/apppasswords):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="VELA" <youraddress@gmail.com>

# SendGrid option (100 emails/day free):
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=SG.xxxxxxxx
# EMAIL_FROM="VELA" <noreply@yourdomain.com>
```

---

## Production Deployment

### Nginx Config (Recommended)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Serve built React app
    root /var/www/vela/client/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Proxy API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # Serve audio files
    location /audio {
        proxy_pass http://localhost:5000;
    }
}
```

### Build for Production
```bash
cd client && npm run build
# Deploy the dist/ folder to your web server
```

### Process Manager (PM2)
```bash
npm install -g pm2
cd server
pm2 start index.js --name vela-server
pm2 startup && pm2 save
```

---

## Music Tracks Included

| Title | Artist | Genre |
|-------|--------|-------|
| Aarzu | Asim Azhar | Urdu Pop |
| Achi Lagti Ho | Hasan Raheem | Urdu Pop |
| Bairan | Banjaare | Urdu Hip-Hop |
| Boyfriend | Ariana Grande | Pop |
| Chalo Door Kahin | Samar Jafri | Urdu Pop |
| Criminal | Talha Anjum & Yashma Gill | Hip-Hop |
| Dekh Zara Pyar Se | Asim Azhar | OST |
| Gal Sun | Sabaat Batin | Punjabi |
| Hoor | Samar Jafri | Urdu Pop |
| Hum | Murtaza Qizilbash | Urdu Pop |
| Khasara | Abdul Hannan & Samar Jafri | Urdu Pop |
| Khayaal | Talwinder x Itzlegit | Punjabi Dancehall |
| Like Jennie | JENNIE | K-Pop |
| Main Rahun | Samar Jafri | OST |
| Obvious | Hasan Raheem | Desi Pop |
| Sheesha | Mitta Ror ft. Swara Verma | Punjabi |
| Tum | Murtaza Qizilbash | Urdu Pop |
| Tum Se Hi | Mohit Chauhan | Bollywood |
| Who | Joji | R&B |

---

*Built with ✨ — VELA Social Platform*
