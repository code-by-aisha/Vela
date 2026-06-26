import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiSearch, HiX, HiHeart, HiChatAlt2, HiMusicNote,
  HiVolumeUp, HiVolumeOff, HiDotsVertical, HiPlay, HiReply,
} from 'react-icons/hi';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import MusicPlayer from '../components/common/MusicPlayer.jsx';
import CommentInput from '../components/common/CommentInput.jsx';
import toast from 'react-hot-toast';
import audioManager from '../utils/audioManager.js';

// ── Shared comment item with replies (mirrors MomentCard's CommentItem) ───────
function CommentItem({ c, momentId, onUpdate }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText,   setReplyText]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/moments/${momentId}/comment/${c._id}/reply`, { text: replyText.trim() });
      onUpdate(data.comments);
      setReplyText('');
      setShowReplies(true);
    } catch { toast.error('Could not post reply.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {/* Avatar */}
      {c.user?.profilePicture
        ? <img src={c.user.profilePicture} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }} />
        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 2 }}>{c.user?.username?.[0]?.toUpperCase()}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Comment bubble */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>@{c.user?.username} </span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{c.text}</span>
        </div>

        {/* Reply toggle */}
        <button
          onClick={() => setShowReplies(v => !v)}
          style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <HiReply size={12} />
          Reply{c.replies?.length > 0 ? ` (${c.replies.length})` : ''}
        </button>

        {/* Replies + reply input */}
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginTop: 6 }}
            >
              {(c.replies || []).map((r, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid var(--accent-dim)' }}>
                  {r.user?.profilePicture
                    ? <img src={r.user.profilePicture} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }} />
                    : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 2 }}>{r.user?.username?.[0]?.toUpperCase()}</div>
                  }
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 10px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>@{r.user?.username} </span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{r.text}</span>
                  </div>
                </div>
              ))}
              <div style={{ paddingLeft: 8, marginTop: 4 }}>
                <CommentInput
                  value={replyText}
                  onChange={setReplyText}
                  onSubmit={submitReply}
                  placeholder={`Reply to @${c.user?.username}...`}
                  submitting={submitting}
                  submitLabel="↑"
                  inputStyle={{ padding: '7px 42px 7px 12px', fontSize: 12, borderRadius: 10 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Reaction emoji map ───────────────────────────────────────────────────────
const REACTIONS = [
  { key: 'beautiful', emoji: '😍' }, { key: 'funny', emoji: '😂' },
  { key: 'love',      emoji: '❤️' },  { key: 'fire',    emoji: '🔥' },
  { key: 'mindBlown', emoji: '😮' }, { key: 'sad',     emoji: '😢' },
  { key: 'crazy',     emoji: '🤯' }, { key: 'wholesome',emoji: '🫶' },
  { key: 'aesthetic', emoji: '✨' }, { key: 'respect', emoji: '👏' },
];

const MOOD_EMOJI = {
  Aesthetic: '✨', Calm: '🌊', Energetic: '⚡', Thoughtful: '💭',
  Creative: '🎨', Personal: '💫', Emotional: '🌙',
};

// ─── Full-screen Reel Card ────────────────────────────────────────────────────
function ReelCard({ moment, isActive, muted, onMuteToggle }) {
  const { user } = useAuth();
  const [reactionCounts, setReactionCounts] = useState(moment.reactionCounts || {});
  const [userReaction, setUserReaction] = useState(
    moment.reactions?.find(r => r.user === user?._id || r.user?._id === user?._id)?.type || null
  );
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(moment.comments || []);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const hasMusic = !!(moment.music?.audioUrl && moment.music?.title);
  const mediaItem = moment.media?.[0];

  // Play/pause video when active changes
  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }
  }, [isActive]);

  // Sync video mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Music: route through audioManager so only one track plays app-wide
  useEffect(() => {
    if (!hasMusic) return;
    if (isActive) {
      const id = audioManager.play(moment.music.audioUrl, {
        volume: muted ? 0 : 0.6,
        loop: true,
      });
      audioRef.current = id;   // store session id (not the Audio element)
    } else {
      // Pause this reel's audio when it scrolls off-screen
      if (audioRef.current) {
        audioManager.pause(audioRef.current);
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioManager.stop();
        audioRef.current = null;
      }
    };
  }, [isActive, moment._id, hasMusic]);

  // Sync mute state into the running session
  useEffect(() => {
    if (audioRef.current) audioManager.setMuted(audioRef.current, muted);
  }, [muted]);

  const handleReact = async (type) => {
    if (!user) return toast.error('Login to react');
    try {
      const { data } = await api.post(`/moments/${moment._id}/react`, { type });
      setReactionCounts(data.reactionCounts);
      setUserReaction(prev => prev === type ? null : type);
      setShowReactions(false);
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const { data } = await api.post(`/moments/${moment._id}/comment`, { text: commentText });
      setComments(data.comments);
      setCommentText('');
    } catch { toast.error('Could not post comment.'); }
    finally { setSubmittingComment(false); }
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* ── Media ── */}
      {mediaItem?.type === 'video' ? (
        <>
          {/* Blurred background */}
          <video src={mediaItem.url} muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.4, transform: 'scale(1.1)' }} />
          {/* Main video */}
          <video
            ref={videoRef}
            src={mediaItem.url}
            loop
            playsInline
            muted={muted}
            style={{ position: 'relative', zIndex: 1, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </>
      ) : mediaItem ? (
        <>
          {/* Blurred background */}
          <img src={mediaItem.url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(25px)', opacity: 0.5, transform: 'scale(1.1)' }} />
          {/* Main image — contains itself */}
          <img
            src={mediaItem.url}
            alt=""
            style={{ position: 'relative', zIndex: 1, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #533747, #0F0D12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'white', textAlign: 'center', lineHeight: 1.5 }}>{moment.caption}</p>
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Top gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

      {/* ── Author info + caption (bottom-left) ── */}
      <div style={{ position: 'absolute', bottom: 90, left: 16, right: 80, zIndex: 5 }}>
        <Link to={`/profile/${moment.author?.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, textDecoration: 'none' }}>
          {moment.author?.profilePicture ? (
            <img src={moment.author.profilePicture} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {moment.author?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>@{moment.author?.username}</div>
            {moment.mood && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{MOOD_EMOJI[moment.mood]} {moment.mood}</div>}
          </div>
        </Link>

        {moment.caption && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {moment.caption}
          </p>
        )}

        {/* Music ticker */}
        {hasMusic && (
          <div
            onClick={() => setShowMusic(!showMusic)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: '100px', width: 'fit-content' }}
          >
            <HiMusicNote style={{ color: '#A78BFA', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'white', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px', textOverflow: 'ellipsis' }}>
              {moment.music.title} — {moment.music.artist}
            </span>
            {/* Animated bars */}
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '14px', flexShrink: 0 }}>
              {[1,2,3].map(i => (
                <motion.div key={i}
                  animate={{ height: isActive ? ['3px','12px','4px','10px','3px'] : '3px' }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: '3px', background: '#A78BFA', borderRadius: '2px' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right action buttons ── */}
      <div style={{ position: 'absolute', right: 14, bottom: 90, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        {/* React */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: userReaction ? '#A78BFA' : 'white' }}
          >
            <div style={{ fontSize: 28 }}>{userReaction ? REACTIONS.find(r => r.key === userReaction)?.emoji : '✨'}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{totalReactions || ''}</span>
          </button>

          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                style={{
                  position: 'absolute', right: '100%', bottom: 0, marginRight: 8,
                  background: 'rgba(15,13,18,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
                  padding: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 4, width: 100, zIndex: 20,
                }}
              >
                {REACTIONS.map(r => (
                  <motion.button
                    key={r.key}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReact(r.key)}
                    style={{
                      padding: '6px 4px', borderRadius: 8, fontSize: 20,
                      background: userReaction === r.key ? 'var(--accent-dim)' : 'transparent',
                      border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                    title={r.key}
                  >
                    {r.emoji}
                    {reactionCounts[r.key] > 0 && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{reactionCounts[r.key]}</span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments */}
        <button onClick={() => setShowComments(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          <HiChatAlt2 size={28} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{comments.length || ''}</span>
        </button>

        {/* Mute */}
        <button onClick={onMuteToggle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          {muted ? <HiVolumeOff size={26} /> : <HiVolumeUp size={26} />}
        </button>

        {/* Music note spin */}
        {hasMusic && (
          <motion.div
            animate={isActive ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            {moment.music?.coverImage ? (
              <img src={moment.music.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <HiMusicNote style={{ color: '#A78BFA' }} size={18} />
            )}
          </motion.div>
        )}
      </div>

      {/* ── Tags ── */}
      {moment.tags?.length > 0 && (
        <div style={{ position: 'absolute', bottom: 60, left: 16, zIndex: 5, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '70%' }}>
          {moment.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: 12, color: '#A78BFA', fontWeight: 600 }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* ── Music mini player popup ── */}
      <AnimatePresence>
        {showMusic && hasMusic && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 10 }}
          >
            <MusicPlayer
              audioUrl={moment.music.audioUrl}
              title={moment.music.title}
              artist={moment.music.artist}
              coverImage={moment.music.coverImage}
            />
            <button onClick={() => setShowMusic(false)} style={{ position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comments drawer ── */}
      <AnimatePresence>
        {showComments && (
          <>
            {/* Backdrop — zIndex must also be above MobileNav */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowComments(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                // Fixed so it sits above the MobileNav on mobile regardless of scroll
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                // zIndex 301 — above MobileNav (200) and backdrop (300)
                zIndex: 301,
                background: 'rgba(15,13,18,0.98)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderRadius: '20px 20px 0 0',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '70dvh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>Comments ({comments.length})</h3>
                <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
              </div>

              {/* Comment list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>No comments yet. Be first! ✨</div>
                ) : (
                  comments.map((c, i) => (
                    <CommentItem key={c._id || i} c={c} momentId={moment._id} onUpdate={setComments} />
                  ))
                )}
              </div>

              {/* Input — extra bottom padding so it clears the MobileNav on mobile */}
              <div style={{
                padding: '12px 16px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                <CommentInput
                  value={commentText}
                  onChange={setCommentText}
                  onSubmit={handleComment}
                  placeholder="Add a comment..."
                  submitting={submittingComment}
                  inputStyle={{ borderRadius: 20 }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User result for search ───────────────────────────────────────────────────
function UserResult({ user }) {
  return (
    <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
      <motion.div whileHover={{ scale: 1.01 }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s' }}>
        {user.profilePicture ? (
          <img src={user.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>{user.username[0].toUpperCase()}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>@{user.username}</div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{user.aura}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.followers?.length || 0} followers</div>
      </motion.div>
    </Link>
  );
}

// ─── Main ExplorePage ─────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    api.get('/moments/explore?limit=30').then(({ data }) => {
      if (data.success) setMoments(data.moments);
    }).catch(() => {}).finally(() => setExploreLoading(false));
  }, []);

  // Intersection observer — track which card is visible
  useEffect(() => {
    if (!containerRef.current || moments.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target);
            if (idx !== -1) setActiveIdx(idx);
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );
    cardRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [moments]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
      if (data.success) setResults(data.results);
    } catch { toast.error('Search failed.'); }
    finally { setLoading(false); }
  };

  const clearSearch = () => { setQuery(''); setResults(null); setShowSearch(false); };

  return (
    <div className="explore-fullscreen" style={{ background: '#000', position: 'relative', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Fixed top bar ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.form key="search-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <HiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search creators, moments..."
                  autoFocus
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button type="button" onClick={clearSearch} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
            </motion.form>
          ) : (
            <motion.div key="title-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', margin: 0 }}>Explore</h1>
              <button onClick={() => setShowSearch(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <HiSearch size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search results overlay ── */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 15, background: 'var(--bg-base)', overflowY: 'auto', padding: '80px 16px 32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Results for "{query}"</h2>
              <button onClick={clearSearch} style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>Clear</button>
            </div>

            {results.users?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Creators</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.users.map(u => <UserResult key={u._id} user={u} />)}
                </div>
              </div>
            )}

            {results.moments?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Moments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  {results.moments.map(m => (
                    <Link key={m._id} to={`/moment/${m._id}`} onClick={clearSearch}>
                      <div style={{ aspectRatio: '1', background: 'var(--bg-elevated)', overflow: 'hidden', borderRadius: 4 }}>
                        {m.media?.[0] ? (
                          <img src={m.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#533747,#0F0D12)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                            <p style={{ fontSize: 10, color: 'white', textAlign: 'center' }}>{m.caption?.slice(0, 40)}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!results.users?.length && !results.moments?.length && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No results for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reels scroll container ── */}
      {exploreLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'white' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(167,139,250,0.3)', borderTopColor: '#A78BFA', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Loading vibes...</span>
          </div>
        </div>
      ) : moments.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌌</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nothing yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Be the first to share a Moment!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            scrollBehavior: 'smooth',
          }}
        >
          {moments.map((moment, idx) => (
            <div
              key={moment._id}
              ref={el => cardRefs.current[idx] = el}
              style={{
                height: '100%',
                minHeight: '100svh',        /* svh = small viewport — avoids mobile chrome bar overlap */
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <ReelCard
                moment={moment}
                isActive={activeIdx === idx}
                muted={muted}
                onMuteToggle={() => setMuted(m => !m)}
              />
            </div>
          ))}
          {/* Scroll hint dots */}
          <div style={{ position: 'fixed', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4, zIndex: 6, pointerEvents: 'none' }}>
            {moments.slice(0, 10).map((_, i) => (
              <div key={i} style={{ width: 4, height: activeIdx === i ? 16 : 4, borderRadius: 2, background: activeIdx === i ? '#A78BFA' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
