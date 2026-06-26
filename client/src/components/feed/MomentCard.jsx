import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiDotsHorizontal, HiBookmark, HiChatAlt2, HiTrash,
  HiReply, HiMusicNote, HiPlay, HiPause, HiVolumeUp, HiVolumeOff,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import audioManager from '../../utils/audioManager.js';
import CommentInput from '../common/CommentInput.jsx';

const REACTIONS = [
  { key: 'beautiful', emoji: '😍', label: 'Beautiful' },
  { key: 'funny',     emoji: '😂', label: 'Funny'     },
  { key: 'love',      emoji: '❤️',  label: 'Love'      },
  { key: 'fire',      emoji: '🔥', label: 'Fire'      },
  { key: 'mindBlown', emoji: '😮', label: 'Mind Blown' },
  { key: 'sad',       emoji: '😢', label: 'Sad'        },
  { key: 'crazy',     emoji: '🤯', label: 'Crazy'      },
  { key: 'wholesome', emoji: '🫶', label: 'Wholesome'  },
  { key: 'aesthetic', emoji: '✨', label: 'Aesthetic'  },
  { key: 'respect',   emoji: '👏', label: 'Respect'    },
];

const MOOD_EMOJI = {
  Aesthetic:'✨', Calm:'🌊', Energetic:'⚡',
  Thoughtful:'💭', Creative:'🎨', Personal:'💫', Emotional:'🌙',
};

// Quick emoji rows for the picker
// ── Stable inline audio player — backed by global audioManager singleton ────
// Only one track can ever play across the entire app at once.
function InlineMusicPlayer({ audioUrl, title, artist, coverImage, startTime = 0, endTime }) {
  const sessionId    = useRef(null);   // the id returned by audioManager.play()
  const [playing,    setPlaying]    = useState(false);
  const [progress,   setProgress]   = useState(startTime);
  const [duration,   setDuration]   = useState(0);
  const [muted,      setMuted]      = useState(false);
  const [errored,    setErrored]    = useState(false);

  // Pre-fetch duration so the seek bar is sized correctly even before play
  useEffect(() => {
    let audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;
    const onMeta = () => { setDuration(audio.duration || 0); };
    const onErr  = () => { setErrored(true); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('error', onErr);
      audio = null;
    };
  }, [audioUrl]);

  // When another track starts, audioManager fires onStopAll → reset our state
  useEffect(() => {
    const onStop = (stoppedId) => {
      if (sessionId.current && stoppedId === sessionId.current) {
        sessionId.current = null;
        setPlaying(false);
        setProgress(startTime);
      }
    };
    audioManager.onStopAll(onStop);
    return () => {
      // Stop this player on unmount (route change, list refresh, etc.)
      if (sessionId.current) {
        audioManager.stop();
        sessionId.current = null;
      }
      audioManager.offStopAll(onStop);
    };
  }, [startTime]);

  const toggle = (e) => {
    e.stopPropagation();
    if (errored) return;

    if (playing && sessionId.current && audioManager.isPlaying(sessionId.current)) {
      audioManager.pause(sessionId.current);
      setPlaying(false);
      return;
    }

    if (sessionId.current && audioManager.isActive(sessionId.current) && !audioManager.isPlaying(sessionId.current)) {
      // Resume a paused session
      audioManager.resume(sessionId.current);
      setPlaying(true);
      return;
    }

    // Start fresh — audioManager will stop any other playing track
    const id = audioManager.play(audioUrl, {
      startTime,
      endTime: endTime || null,
      onTimeUpdate: (t) => setProgress(t),
      onEnded: () => {
        sessionId.current = null;
        setPlaying(false);
        setProgress(startTime);
      },
      onError: () => {
        sessionId.current = null;
        setPlaying(false);
        setErrored(true);
      },
    });
    sessionId.current = id;
    setPlaying(true);
    setMuted(false);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!sessionId.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clipDurLocal = (endTime || duration) - startTime;
    const t = startTime + ((e.clientX - rect.left) / rect.width) * clipDurLocal;
    const clamped = Math.max(startTime, Math.min(t, endTime || duration));
    audioManager.seek(sessionId.current, clamped);
    setProgress(clamped);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (sessionId.current) audioManager.setMuted(sessionId.current, next);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const clipDur = (endTime || duration) - startTime;
  const elapsed = Math.max(0, progress - startTime);
  const pct     = clipDur > 0 ? Math.min(100, (elapsed / clipDur) * 100) : 0;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--bg-glass-border)', borderRadius:14, padding:'10px 14px' }}>
      {coverImage
        ? <img src={coverImage} alt="" style={{ width:42, height:42, borderRadius:9, objectFit:'cover', flexShrink:0, border:'1px solid rgba(255,255,255,0.08)' }} />
        : <div style={{ width:42, height:42, borderRadius:9, background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><HiMusicNote size={18} color="white" /></div>
      }
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color: errored ? '#EF4444' : 'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {errored ? '⚠ Audio unavailable' : title}
        </div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:5 }}>{artist}</div>
        {!errored && (
          <div
            style={{ position:'relative', height:3, background:'rgba(255,255,255,0.1)', borderRadius:2, cursor:'pointer' }}
            onClick={handleSeek}
          >
            <div style={{ height:'100%', width:`${pct}%`, background:'var(--accent)', borderRadius:2, transition:'width 0.1s linear' }} />
          </div>
        )}
      </div>
      {!errored && (
        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace', flexShrink:0 }}>
          {fmt(elapsed)}/{fmt(clipDur)}
        </span>
      )}
      <button onClick={toggleMute}
        style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', display:'flex', padding:3, flexShrink:0 }}>
        {muted ? <HiVolumeOff size={14}/> : <HiVolumeUp size={14}/>}
      </button>
      {!errored && (
        <motion.button onClick={toggle} whileTap={{ scale:0.9 }}
          style={{ width:34, height:34, borderRadius:'50%', background:'var(--grad-brand)', color:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {playing ? <HiPause size={16}/> : <HiPlay size={16} style={{ marginLeft:1 }}/>}
        </motion.button>
      )}
    </div>
  );
}

// ── Comment item with replies ─────────────────────────────────────────────────
function CommentItem({ c, momentId, currentUser, onUpdate }) {
  const [showReplies,  setShowReplies]  = useState(false);
  const [replyText,    setReplyText]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);

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
    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
      {c.user?.profilePicture
        ? <img src={c.user.profilePicture} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0, marginTop:2 }} />
        : <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0, marginTop:2 }}>{c.user?.username?.[0]?.toUpperCase()}</div>
      }
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:'var(--bg-glass)', borderRadius:12, padding:'8px 12px', marginBottom:4 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>@{c.user?.username} </span>
          <span style={{ fontSize:13, color:'var(--text-primary)' }}>{c.text}</span>
        </div>

        {/* Reply toggle */}
        <button onClick={() => setShowReplies(!showReplies)}
          style={{ fontSize:11, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center', gap:4 }}>
          <HiReply size={12} />
          Reply{c.replies?.length > 0 ? ` (${c.replies.length})` : ''}
        </button>

        {/* Replies */}
        <AnimatePresence>
          {showReplies && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              style={{ overflow:'hidden', marginTop:6 }}>
              {(c.replies || []).map((r, ri) => (
                <div key={ri} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6, paddingLeft:8, borderLeft:'2px solid var(--accent-dim)' }}>
                  {r.user?.profilePicture
                    ? <img src={r.user.profilePicture} alt="" style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover', flexShrink:0, marginTop:2 }} />
                    : <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'white', flexShrink:0, marginTop:2 }}>{r.user?.username?.[0]?.toUpperCase()}</div>
                  }
                  <div style={{ background:'var(--bg-glass)', borderRadius:10, padding:'6px 10px', flex:1, minWidth:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)' }}>@{r.user?.username} </span>
                    <span style={{ fontSize:12, color:'var(--text-primary)' }}>{r.text}</span>
                  </div>
                </div>
              ))}

              {/* Reply input */}
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

// ── Main MomentCard ───────────────────────────────────────────────────────────
export default function MomentCard({ moment, onDelete }) {
  const { user } = useAuth();
  const [reactionCounts, setReactionCounts] = useState(moment.reactionCounts || {});
  const [userReaction,   setUserReaction]   = useState(
    moment.reactions?.find(r => r.user === user?._id || r.user?._id === user?._id)?.type || null
  );
  const [showReactions, setShowReactions] = useState(false);
  const [saved,         setSaved]         = useState(moment.savedBy?.includes(user?._id));
  const [showComments,  setShowComments]  = useState(false);
  const [comment,       setComment]       = useState('');
  const [comments,      setComments]      = useState(moment.comments || []);
  const [showMenu,      setShowMenu]      = useState(false);
  const [mediaIdx,      setMediaIdx]      = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  const totalReactions = Object.values(reactionCounts).reduce((a,b) => a+b, 0);
  const isAuthor = user?._id === (moment.author?._id || moment.author);
  const hasMusic = !!(moment.music?.audioUrl && moment.music?.title);
  const author   = moment.author;

  const handleReact = async (type) => {
    try {
      const { data } = await api.post(`/moments/${moment._id}/react`, { type });
      setReactionCounts(data.reactionCounts);
      setUserReaction(prev => prev === type ? null : type);
      setShowReactions(false);
    } catch { toast.error('Could not react.'); }
  };

  const handleSave = async () => {
    try {
      const { data } = await api.post(`/moments/${moment._id}/save`);
      setSaved(data.saved);
      toast.success(data.saved ? 'Saved ✨' : 'Removed');
    } catch { toast.error('Could not save.'); }
  };

  const handleComment = async () => {
    if (!comment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const { data } = await api.post(`/moments/${moment._id}/comment`, { text: comment });
      setComments(data.comments);
      setComment('');
    } catch { toast.error('Could not post comment.'); }
    finally { setSubmittingComment(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this Moment?')) return;
    try {
      await api.delete(`/moments/${moment._id}`);
      toast.success('Moment deleted.');
      onDelete?.(moment._id);
    } catch { toast.error('Could not delete.'); }
  };

  return (
    <motion.article className="moment-card"
      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.98 }}
      transition={{ duration:0.22, ease:[0.25,0.4,0.25,1] }}
      style={{ background:'var(--bg-elevated)', border:'1px solid var(--bg-glass-border)', borderRadius:'var(--radius-xl)', overflow:'hidden', marginBottom:20, minWidth:0, width:'100%', wordBreak:'break-word' }}
    >
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px' }}>
        <Link to={`/profile/${author?.username}`} style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          {author?.profilePicture
            ? <img src={author.profilePicture} alt={author.username} style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--accent)' }} />
            : <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'white' }}>{author?.username?.[0]?.toUpperCase()}</div>
          }
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>@{author?.username}</span>
              {author?.aura && author.aura !== 'Rising Star' && <span className="aura-badge" style={{ fontSize:9, padding:'2px 8px' }}>{author.aura}</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
              {moment.mood && <span className={`mood-badge mood-${moment.mood}`}>{MOOD_EMOJI[moment.mood]} {moment.mood}</span>}
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(moment.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
            </div>
          </div>
        </Link>
        <div style={{ position:'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ color:'var(--text-muted)', padding:6, background:'none', border:'none', cursor:'pointer', borderRadius:'var(--radius-sm)' }}>
            <HiDotsHorizontal size={18} />
          </button>
          {showMenu && (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              style={{ position:'absolute', right:0, top:'100%', zIndex:10, background:'var(--bg-elevated)', border:'1px solid var(--bg-glass-border)', borderRadius:'var(--radius-md)', minWidth:140, padding:6, boxShadow:'var(--shadow-lg)' }}>
              <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--text-secondary)', background:'none', border:'none', cursor:'pointer' }}>
                <HiBookmark size={14} /> {saved ? 'Unsave' : 'Save Moment'}
              </button>
              {isAuthor && (
                <button onClick={handleDelete} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, color:'#EF4444', background:'none', border:'none', cursor:'pointer' }}>
                  <HiTrash size={14} /> Delete Moment
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Caption ── */}
      {moment.caption && <p style={{ padding:'0 20px 16px', fontSize:15, lineHeight:1.6 }}>{moment.caption}</p>}

      {/* ── Media ── */}
      {moment.media?.length > 0 && (
        <div style={{ position:'relative' }}>
          {moment.media[mediaIdx]?.type === 'video'
            ? <video src={moment.media[mediaIdx].url} controls style={{ width:'100%', maxHeight:500, objectFit:'cover', display:'block' }} />
            : <img src={moment.media[mediaIdx]?.url} alt="moment" style={{ width:'100%', maxHeight:500, objectFit:'cover', display:'block' }} loading="lazy" />
          }
          {moment.media.length > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'10px 0', background:'var(--bg-elevated)' }}>
              {moment.media.map((_,i) => (
                <button key={i} onClick={() => setMediaIdx(i)}
                  style={{ width: mediaIdx===i ? 20 : 7, height:7, borderRadius:99, background: mediaIdx===i ? 'var(--accent)' : 'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', padding:0, transition:'all 0.2s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Music Player (stable, no re-mount) ── */}
      {hasMusic && (
        <div style={{ padding:'12px 20px 4px' }}>
          <InlineMusicPlayer
            audioUrl={moment.music.audioUrl}
            title={moment.music.title}
            artist={moment.music.artist}
            coverImage={moment.music.coverImage}
            startTime={moment.music.startTime || 0}
            endTime={moment.music.endTime || null}
          />
        </div>
      )}

      {/* ── Tags ── */}
      {moment.tags?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'12px 20px 0' }}>
          {moment.tags.map(tag => <span key={tag} style={{ fontSize:13, color:'var(--accent)', cursor:'pointer' }}>#{tag}</span>)}
        </div>
      )}

      {/* ── Action bar ── */}
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:4, borderTop:'1px solid var(--bg-glass-border)', marginTop:12 }}>
        {/* Reactions */}
        <div style={{ position:'relative', flex:1 }}>
          <button onClick={() => setShowReactions(!showReactions)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-md)', background: userReaction ? 'var(--accent-dim)' : 'var(--bg-glass)', border:`1px solid ${userReaction ? 'rgba(167,139,250,0.3)' : 'var(--bg-glass-border)'}`, color: userReaction ? 'var(--accent)' : 'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
            {userReaction ? REACTIONS.find(r => r.key===userReaction)?.emoji : '✨'}
            <span>{totalReactions > 0 ? totalReactions : 'React'}</span>
          </button>
          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity:0, y:10, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:0.9 }}
                style={{ position:'absolute', bottom:'120%', left:0, zIndex:20, background:'rgba(24,24,24,0.97)', backdropFilter:'blur(20px)', border:'1px solid var(--bg-glass-border)', borderRadius:'var(--radius-lg)', padding:12, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, minWidth:260, boxShadow:'var(--shadow-lg)' }}>
                {REACTIONS.map(r => (
                  <motion.button key={r.key} whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }} onClick={() => handleReact(r.key)} title={r.label}
                    style={{ padding:'8px 4px', borderRadius:'var(--radius-sm)', background: userReaction===r.key ? 'var(--accent-dim)' : 'transparent', border:'1px solid transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <span style={{ fontSize:20 }}>{r.emoji}</span>
                    <span style={{ fontSize:9, color:'var(--text-muted)' }}>{reactionCounts[r.key] > 0 ? reactionCounts[r.key] : ''}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments */}
        <button onClick={() => setShowComments(!showComments)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-md)', background:'var(--bg-glass)', border:'1px solid var(--bg-glass-border)', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
          <HiChatAlt2 size={16} />
          <span>{comments.length > 0 ? comments.length : 'Comment'}</span>
        </button>

        {/* Save */}
        <button onClick={handleSave}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:'var(--radius-md)', background: saved ? 'var(--accent-dim)' : 'var(--bg-glass)', border:`1px solid ${saved ? 'rgba(167,139,250,0.3)' : 'var(--bg-glass-border)'}`, color: saved ? 'var(--accent)' : 'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
          <HiBookmark size={16} />
        </button>
      </div>

      {/* ── Reaction summary ── */}
      {totalReactions > 0 && (
        <div style={{ padding:'0 20px 8px', display:'flex', gap:6, flexWrap:'wrap' }}>
          {REACTIONS.filter(r => reactionCounts[r.key] > 0).map(r => (
            <span key={r.key} style={{ fontSize:12, color:'var(--text-muted)' }}>{r.emoji} {reactionCounts[r.key]}</span>
          ))}
        </div>
      )}

      {/* ── Comments section ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'12px 20px 16px', borderTop:'1px solid var(--bg-glass-border)' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16, maxHeight:360, overflowY:'auto' }}>
                {comments.length === 0
                  ? <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:12 }}>No comments yet. Be the first! ✨</p>
                  : comments.map((c, i) => (
                    <CommentItem key={c._id || i} c={c} momentId={moment._id} currentUser={user} onUpdate={setComments} />
                  ))
                }
              </div>

              {/* Comment input */}
              <CommentInput
                value={comment}
                onChange={setComment}
                onSubmit={handleComment}
                placeholder="Add a comment..."
                submitting={submittingComment}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
