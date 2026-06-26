import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiVolumeUp, HiVolumeOff, HiHeart, HiChat, HiUpload } from 'react-icons/hi';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

function ReelItem({ reel, isActive }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [reactionCount, setReactionCount] = useState(Object.values(reel.reactionCounts || {}).reduce((a, b) => a + b, 0));

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleReact = async () => {
    try {
      const { data } = await api.post(`/moments/${reel._id}/react`, { type: 'love' });
      setReactionCount(Object.values(data.reactionCounts).reduce((a, b) => a + b, 0));
    } catch {}
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', overflow: 'hidden', flexShrink: 0 }}>
      {/* Blurred background video to fit aspect ratios */}
      <video
        src={reel.media?.[0]?.url}
        muted
        loop
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.5 }}
      />

      <video
        ref={videoRef}
        src={reel.media?.[0]?.url}
        loop
        muted={muted}
        playsInline
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
      />

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%, transparent 80%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />

      {/* Author info */}
      <div style={{ position: 'absolute', bottom: 80, left: 16, right: 72 }}>
        <Link to={`/profile/${reel.author?.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 10 }}>
          {reel.author?.profilePicture ? (
            <img src={reel.author.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', border: '2px solid white' }}>
              {reel.author?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>@{reel.author?.username}</span>
          <span className="aura-badge" style={{ fontSize: 9 }}>{reel.author?.aura}</span>
        </Link>

        {reel.caption && (
          <p style={{ fontSize: 14, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.6)', lineHeight: 1.5, maxWidth: '80%' }}>
            {reel.caption}
          </p>
        )}

        {reel.music?.title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            🎵 {reel.music.title} — {reel.music.artist}
          </div>
        )}
      </div>

      {/* Side actions */}
      <div style={{ position: 'absolute', right: 12, bottom: 100, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={handleReact}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <HiHeart size={22} color="white" />
          </motion.button>
          <span style={{ fontSize: 11, color: 'white' }}>{reactionCount}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.button whileHover={{ scale: 1.1 }}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <HiChat size={22} color="white" />
          </motion.button>
          <span style={{ fontSize: 11, color: 'white' }}>{reel.comments?.length || 0}</span>
        </div>

        <motion.button whileHover={{ scale: 1.1 }} onClick={() => setMuted(!muted)}
          style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {muted ? <HiVolumeOff size={22} color="white" /> : <HiVolumeUp size={22} color="white" />}
        </motion.button>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    api.get('/reels?limit=20').then(({ data }) => {
      if (data.success) setReels(data.reels);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const idx = Math.round(container.scrollTop / window.innerHeight);
      setActiveIdx(idx);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading Reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🎬</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>No Reels yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Be the first to upload a Reel!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh', overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {reels.map((reel, i) => (
        <div key={reel._id} style={{ scrollSnapAlign: 'start' }}>
          <ReelItem reel={reel} isActive={i === activeIdx} />
        </div>
      ))}
    </div>
  );
}
