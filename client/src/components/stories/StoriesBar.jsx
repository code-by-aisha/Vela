import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus, HiX, HiChevronLeft, HiChevronRight,
  HiMusicNote, HiPlay, HiPause, HiHeart, HiEye,
} from 'react-icons/hi';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const MOOD_EMOJI = {
  Aesthetic:'✨', Calm:'🌊', Energetic:'⚡',
  Thoughtful:'💭', Creative:'🎨', Personal:'💫', Emotional:'🌙',
};

export default function StoriesBar() {
  const { user }   = useAuth();
  const { socket } = useSocket();

  // ── Feed state ────────────────────────────────────────────────────────────
  const [storyGroups,    setStoryGroups]    = useState([]);
  const [activeGroup,    setActiveGroup]    = useState(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress,       setProgress]       = useState(0);
  const [paused,         setPaused]         = useState(false);
  const [musicPlaying,   setMusicPlaying]   = useState(false);
  const audioRef = useRef(null);

  // ── Heart state ───────────────────────────────────────────────────────────
  // heartMap: { [storyId]: { hearted: bool, count: number } }
  const [heartMap,        setHeartMap]        = useState({});
  const [heartAnim,       setHeartAnim]       = useState(null); // storyId being animated
  const [showHeartsPanel, setShowHeartsPanel] = useState(false);
  const [heartsList,      setHeartsList]      = useState([]);
  const [heartsLoading,   setHeartsLoading]   = useState(false);

  // ── Load feed ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/stories/feed')
      .then(({ data }) => { if (data.success) setStoryGroups(data.storyGroups || []); })
      .catch(() => {});
  }, []);

  // ── Socket: receive heart as story author ─────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onHeart = ({ storyId, sender, heartCount }) => {
      setHeartMap(prev => ({
        ...prev,
        [storyId]: { ...prev[storyId], count: heartCount },
      }));
      toast(`❤️ @${sender.username} sent a heart`, {
        duration: 3500,
        icon: '❤️',
        style: { background: 'rgba(15,13,18,0.97)', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' },
      });
    };
    socket.on('story:heart', onHeart);
    return () => socket.off('story:heart', onHeart);
  }, [socket]);

  // ── Heart actions ─────────────────────────────────────────────────────────
  const sendHeart = useCallback(async (storyId) => {
    const cur = heartMap[storyId] || { hearted: false, count: 0 };
    // Optimistic
    const next = { hearted: !cur.hearted, count: cur.hearted ? cur.count - 1 : cur.count + 1 };
    setHeartMap(prev => ({ ...prev, [storyId]: next }));
    // Float animation
    setHeartAnim(storyId);
    setTimeout(() => setHeartAnim(null), 700);
    try {
      const { data } = await api.post(`/stories/${storyId}/heart`);
      setHeartMap(prev => ({ ...prev, [storyId]: { hearted: data.hearted, count: data.heartCount } }));
    } catch (err) {
      setHeartMap(prev => ({ ...prev, [storyId]: cur }));
      const msg = err.response?.data?.message || 'Could not send heart.';
      toast.error(msg);
    }
  }, [heartMap]);

  const loadHearts = useCallback(async (storyId) => {
    setHeartsLoading(true);
    setHeartsList([]);
    setShowHeartsPanel(true);
    try {
      const { data } = await api.get(`/stories/${storyId}/hearts`);
      if (data.success) setHeartsList(data.hearts || []);
    } catch { toast.error('Could not load hearts.'); }
    finally { setHeartsLoading(false); }
  }, []);

  // ── Audio helpers ─────────────────────────────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setMusicPlaying(false);
  };

  const startAudio = (story) => {
    stopAudio();
    if (!story?.music?.audioUrl) return;
    const audio = new Audio(story.music.audioUrl);
    audio.loop   = true;
    audio.volume = 0.65;
    audioRef.current = audio;
    audio.play()
      .then(() => setMusicPlaying(true))
      .catch(() => setMusicPlaying(false));
  };

  const toggleMusic = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else { audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {}); }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const openStory = async (group, idx = 0) => {
    setActiveGroup(group);
    setActiveStoryIdx(idx);
    setProgress(0);
    setPaused(false);
    setShowHeartsPanel(false);
    startAudio(group.stories[idx]);
    try { await api.post(`/stories/${group.stories[idx]._id}/view`); } catch {}
  };

  const closeViewer = () => {
    stopAudio();
    setActiveGroup(null);
    setPaused(false);
    setShowHeartsPanel(false);
  };

  const goToStory = (group, idx) => {
    setActiveStoryIdx(idx);
    setProgress(0);
    setShowHeartsPanel(false);
    startAudio(group.stories[idx]);
    try { api.post(`/stories/${group.stories[idx]._id}/view`); } catch {}
  };

  const nextStory = useCallback(() => {
    if (!activeGroup) return;
    if (activeStoryIdx < activeGroup.stories.length - 1) {
      goToStory(activeGroup, activeStoryIdx + 1);
    } else {
      const gi = storyGroups.findIndex(g => g.author._id === activeGroup.author._id);
      if (gi < storyGroups.length - 1) openStory(storyGroups[gi + 1]);
      else closeViewer();
    }
  }, [activeGroup, activeStoryIdx, storyGroups]);

  const prevStory = () => {
    if (!activeGroup || activeStoryIdx === 0) return;
    goToStory(activeGroup, activeStoryIdx - 1);
  };

  // ── Progress bar auto-advance ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeGroup || paused) return;
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { nextStory(); return 0; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(t);
  }, [activeGroup, activeStoryIdx, paused, nextStory]);

  useEffect(() => () => stopAudio(), []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentStory = activeGroup?.stories[activeStoryIdx];
  const hasMusic     = !!(currentStory?.music?.audioUrl && currentStory?.music?.title);
  const isOwn        = activeGroup?.author?._id === user?._id;
  const storyHeart   = currentStory ? (heartMap[currentStory._id] || { hearted: false, count: currentStory.hearts?.length || 0 }) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Stories scroll strip ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none',
      }}>
        {/* Add story */}
        <div
          onClick={() => toast('Go to the Stories page to add a story ✨')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
        >
          <div style={{
            width: 64, height: 80, borderRadius: 20,
            background: 'var(--bg-elevated)', border: '2px dashed var(--bg-glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiPlus size={14} color="white" />
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Add Story</span>
        </div>

        {/* Story capsules */}
        {storyGroups.map(group => (
          <motion.div
            key={group.author._id}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => openStory(group)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 64, height: 80, borderRadius: 20, position: 'relative', overflow: 'hidden',
              border: group.hasUnviewed ? '2px solid var(--accent)' : '2px solid var(--bg-glass-border)',
              boxShadow: group.hasUnviewed ? '0 0 14px var(--accent-glow)' : 'none',
            }}>
              {group.stories[0]?.media?.type === 'video' ? (
                <video src={group.stories[0].media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : (
                <img src={group.stories[0]?.media?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {group.stories[0]?.music?.audioUrl && (
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiMusicNote size={10} color="white" />
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 4, left: 4 }}>
                {group.author.profilePicture
                  ? <img src={group.author.profilePicture} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid white' }} />
                  : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', border: '1.5px solid white' }}>{group.author.username[0].toUpperCase()}</div>
                }
              </div>
              {group.stories[0]?.mood && (
                <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 12 }}>{MOOD_EMOJI[group.stories[0].mood]}</div>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {group.author.username}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Full-screen story viewer ──────────────────────────────────────── */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={closeViewer}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400, maxHeight: '92vh',
                background: '#0a0a0f', borderRadius: 24, overflow: 'hidden',
                position: 'relative', aspectRatio: '9/16',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              }}
            >
              {/* ── Progress bars ── */}
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 3, zIndex: 10 }}>
                {activeGroup.stories.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.28)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: 'white',
                      width: i < activeStoryIdx ? '100%' : i === activeStoryIdx ? `${progress}%` : '0%',
                      transition: 'width 0.1s linear',
                    }} />
                  </div>
                ))}
              </div>

              {/* ── Author row ── */}
              <div style={{ position: 'absolute', top: 24, left: 12, right: 48, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                {activeGroup.author.profilePicture
                  ? <img src={activeGroup.author.profilePicture} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{activeGroup.author.username[0].toUpperCase()}</div>
                }
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)', display: 'block' }}>@{activeGroup.author.username}</span>
                  {currentStory?.mood && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{MOOD_EMOJI[currentStory.mood]} {currentStory.mood}</span>}
                </div>
              </div>

              {/* ── Close button ── */}
              <button
                onClick={closeViewer}
                style={{ position: 'absolute', top: 24, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
              >
                <HiX size={18} />
              </button>

              {/* ── Media ── */}
              <div
                style={{ width: '100%', height: '100%', position: 'relative' }}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
              >
                {currentStory?.media?.type === 'video' ? (
                  <>
                    <video src={currentStory.media.url} muted autoPlay loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px)', opacity: 0.45 }} />
                    <video src={currentStory.media.url} autoPlay playsInline style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                  </>
                ) : currentStory?.media?.url ? (
                  <img src={currentStory.media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--mauve), var(--grape))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 48 }}>{MOOD_EMOJI[currentStory?.mood] || '✨'}</span>
                  </div>
                )}

                {/* Tap zones — left/right */}
                <div onClick={prevStory} style={{ position: 'absolute', left: 0, top: 0, width: '33%', height: '100%', zIndex: 5, cursor: 'pointer' }} />
                <div onClick={nextStory} style={{ position: 'absolute', right: 0, top: 0, width: '33%', height: '100%', zIndex: 5, cursor: 'pointer' }} />
              </div>

              {/* ── Text overlay ── */}
              {currentStory?.text && (
                <div style={{
                  position: 'absolute', bottom: hasMusic ? 110 : 72, left: 14, right: 14,
                  background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: '10px 14px',
                  backdropFilter: 'blur(10px)', zIndex: 6,
                }}>
                  <p style={{ color: 'white', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{currentStory.text}</p>
                </div>
              )}

              {/* ── Bottom bar: music + heart ── */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 8,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
                padding: '20px 14px 16px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
              }}>
                {/* Music player */}
                {hasMusic ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    {currentStory.music.coverImage
                      ? <img src={currentStory.music.coverImage} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
                      : <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HiMusicNote size={16} color="white" /></div>
                    }
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentStory.music.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentStory.music.artist}</div>
                    </div>
                    <button onClick={toggleMusic} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {musicPlaying ? <HiPause size={14} /> : <HiPlay size={14} />}
                    </button>
                  </div>
                ) : <div style={{ flex: 1 }} />}

                {/* Heart button + count — only non-owner followers can heart */}
                {!isOwn && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, position: 'relative' }}>
                    {/* Floating heart animation */}
                    <AnimatePresence>
                      {heartAnim === currentStory?._id && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -60, scale: 1.6 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.65 }}
                          style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: 26, pointerEvents: 'none', zIndex: 20 }}
                        >
                          ❤️
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => sendHeart(currentStory._id)}
                      style={{
                        width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: storyHeart?.hearted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        boxShadow: storyHeart?.hearted ? '0 0 18px rgba(239,68,68,0.4)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <HiHeart size={22} color={storyHeart?.hearted ? '#EF4444' : 'white'} />
                    </motion.button>
                    {storyHeart?.count > 0 && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{storyHeart.count}</span>
                    )}
                  </div>
                )}

                {/* Owner: see who hearted */}
                {isOwn && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <button
                      onClick={() => loadHearts(currentStory._id)}
                      style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                    >
                      <HiHeart size={22} color="#EF4444" />
                    </button>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                      {currentStory?.hearts?.length || 0}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Viewers & hearts panel (owner) ── */}
              <AnimatePresence>
                {showHeartsPanel && (
                  <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
                      background: 'rgba(10,10,15,0.97)', borderRadius: '20px 20px 0 0',
                      padding: '14px 0 24px', maxHeight: '60%', overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                      boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>❤️ Hearts</span>
                      <button onClick={() => setShowHeartsPanel(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><HiX size={16} /></button>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                      {heartsLoading ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading…</div>
                      ) : heartsList.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                          <div style={{ fontSize: 36, marginBottom: 8 }}>🫶</div>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>No hearts yet</p>
                        </div>
                      ) : heartsList.map(h => (
                        <div key={h._id || h.user?._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
                          {h.user?.profilePicture
                            ? <img src={h.user.profilePicture} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(239,68,68,0.4)' }} />
                            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>{h.user?.username?.[0]?.toUpperCase()}</div>
                          }
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>@{h.user?.username}</div>
                            <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)' }}>❤️ Sent a heart</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prev / Next nav arrows */}
              {activeGroup.stories.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevStory(); }} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 9, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', opacity: activeStoryIdx > 0 ? 1 : 0.2 }}>
                    <HiChevronLeft size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextStory(); }} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 9, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <HiChevronRight size={18} />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
