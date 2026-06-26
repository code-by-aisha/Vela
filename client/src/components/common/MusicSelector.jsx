import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiX, HiPlay, HiPause, HiCheck, HiMusicNote, HiScissors, HiArrowLeft } from 'react-icons/hi';
import api from '../../utils/api.js';
import audioManager from '../../utils/audioManager.js';

const fmt = (s) => {
  if (!s && s !== 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

// ─── Clip Trimmer ─────────────────────────────────────────────────────────────
function ClipTrimmer({ track, onConfirm, onBack }) {
  const sessionId  = useRef(null);
  const duration   = track.duration || 180;

  const [startTime,   setStartTime]   = useState(0);
  const [endTime,     setEndTime]     = useState(duration);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [loaded,      setLoaded]      = useState(false);
  const [loadError,   setLoadError]   = useState(false);
  const [startInput,  setStartInput]  = useState('0:00');
  const [endInput,    setEndInput]    = useState(fmt(duration));

  useEffect(() => { setStartInput(fmt(startTime)); }, [startTime]);
  useEffect(() => { setEndInput(fmt(endTime));     }, [endTime]);

  // Pre-load metadata to confirm audio is reachable
  useEffect(() => {
    let audio = new Audio();
    audio.preload = 'metadata';
    audio.src = track.audioUrl;
    const onCanPlay = () => { setLoaded(true); setLoadError(false); };
    const onError   = () => { setLoadError(true); setLoaded(false); };
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error',   onError);
    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error',   onError);
      audio = null;
    };
  }, [track.audioUrl]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (sessionId.current) { audioManager.stop(); sessionId.current = null; }
    };
  }, []);

  // React to global stop (e.g. another player started)
  useEffect(() => {
    const onStop = (stoppedId) => {
      if (sessionId.current && stoppedId === sessionId.current) {
        sessionId.current = null;
        setIsPlaying(false);
      }
    };
    audioManager.onStopAll(onStop);
    return () => audioManager.offStopAll(onStop);
  }, []);

  const playClip = () => {
    if (!loaded) return;
    const id = audioManager.play(track.audioUrl, {
      startTime,
      endTime,
      onTimeUpdate: (t) => setCurrentTime(t),
      onEnded: () => {
        sessionId.current = null;
        setIsPlaying(false);
        setCurrentTime(startTime);
      },
      onError: () => {
        sessionId.current = null;
        setIsPlaying(false);
        setLoadError(true);
      },
    });
    sessionId.current = id;
    setIsPlaying(true);
  };

  const pauseClip = () => {
    if (sessionId.current) { audioManager.pause(sessionId.current); }
    setIsPlaying(false);
  };

  const stopClip = () => {
    if (sessionId.current) { audioManager.stop(); sessionId.current = null; }
    setIsPlaying(false);
    setCurrentTime(startTime);
  };

  const parseTime = (str) => {
    if (!str) return null;
    str = str.trim();
    if (str.includes(':')) {
      const parts = str.split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseFloat(parts[1]) || 0);
    }
    return parseFloat(str) || null;
  };

  const handleStartInput  = (e) => setStartInput(e.target.value);
  const commitStartInput  = () => {
    const t = parseTime(startInput);
    if (t === null || isNaN(t)) { setStartInput(fmt(startTime)); return; }
    const clamped = Math.max(0, Math.min(t, endTime - 1, duration));
    setStartTime(clamped);
    stopClip();
  };

  const handleEndInput    = (e) => setEndInput(e.target.value);
  const commitEndInput    = () => {
    const t = parseTime(endInput);
    if (t === null || isNaN(t)) { setEndInput(fmt(endTime)); return; }
    const clamped = Math.max(startTime + 1, Math.min(t, duration));
    setEndTime(clamped);
    stopClip();
  };

  const handleStartSlider = (e) => {
    const val = Math.min(Number(e.target.value), endTime - 1);
    setStartTime(val);
    stopClip();
  };

  const handleEndSlider = (e) => {
    const val = Math.max(Number(e.target.value), startTime + 1);
    setEndTime(val);
    stopClip();
  };

  const clipDuration = Math.round(endTime - startTime);
  const startPct     = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct       = duration > 0 ? (endTime   / duration) * 100 : 100;
  const progressPct  = (endTime - startTime) > 0
    ? Math.min(100, ((currentTime - startTime) / (endTime - startTime)) * 100)
    : 0;

  const presets = [30, 60, 90, 120].filter(s => s < duration);
  presets.push(duration);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => { stopClip(); onBack(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, flexShrink: 0 }}>
          <HiArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{track.artist} · {fmt(duration)} total</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
          <HiScissors size={11} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{fmt(clipDuration)}</span>
        </div>
      </div>

      {loadError && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#EF4444' }}>
          ⚠️ Could not load audio. Check that the file exists in server/public/audio/
        </div>
      )}

      {/* Visual timeline */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 14px 10px', border: '1px solid var(--bg-glass-border)' }}>
        <div style={{ position: 'relative', height: 52, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 10, cursor: 'pointer' }}
          onClick={(e) => {
            if (!loaded) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct  = (e.clientX - rect.left) / rect.width;
            const t    = Math.max(startTime, Math.min(endTime, pct * duration));
            if (sessionId.current) audioManager.seek(sessionId.current, t);
            setCurrentTime(t);
          }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 1.5, padding: '4px 6px' }}>
            {Array.from({ length: 80 }, (_, i) => {
              const h = 18 + Math.abs(Math.sin(i * 0.45) * 16 + Math.sin(i * 1.3) * 10);
              const inClip = i / 80 >= startPct / 100 && i / 80 <= endPct / 100;
              return (
                <div key={i} style={{
                  flex: 1, height: `${h}px`,
                  background: inClip ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 2, opacity: inClip ? 0.85 : 0.5,
                  transition: 'background 0.15s',
                }} />
              );
            })}
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${startPct}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${100 - endPct}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${startPct}%`, width: `${endPct - startPct}%`, border: '2px solid rgba(167,139,250,0.7)', borderRadius: 4, pointerEvents: 'none' }} />
          {loaded && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${startPct + progressPct * (endPct - startPct) / 100}%`, width: 2, background: 'white', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 3, borderRadius: 2 }} />
          )}
          <div style={{ position: 'absolute', bottom: 2, left: 6, fontSize: 9, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}>0:00</div>
          <div style={{ position: 'absolute', bottom: 2, right: 6, fontSize: 9, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}>{fmt(duration)}</div>
        </div>

        {/* Start control */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>▶ Start</span>
            <input value={startInput} onChange={handleStartInput}
              onBlur={commitStartInput} onKeyDown={e => e.key === 'Enter' && commitStartInput()}
              placeholder="0:00"
              style={{ width: 64, padding: '3px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--accent)', textAlign: 'center', outline: 'none', fontFamily: 'monospace' }}
            />
          </div>
          <input type="range" min={0} max={duration} step={1} value={startTime}
            onChange={handleStartSlider}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }}
          />
        </div>

        {/* End control */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>⏹ End</span>
            <input value={endInput} onChange={handleEndInput}
              onBlur={commitEndInput} onKeyDown={e => e.key === 'Enter' && commitEndInput()}
              placeholder={fmt(duration)}
              style={{ width: 64, padding: '3px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(134,187,189,0.1)', border: '1px solid rgba(134,187,189,0.35)', color: '#86BBBD', textAlign: 'center', outline: 'none', fontFamily: 'monospace' }}
            />
          </div>
          <input type="range" min={0} max={duration} step={1} value={endTime}
            onChange={handleEndSlider}
            style={{ width: '100%', accentColor: '#86BBBD', cursor: 'pointer', height: 4 }}
          />
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Quick clips:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {presets.map(sec => {
            const label  = sec === duration ? 'Full' : sec >= 60 ? `${sec/60}m` : `${sec}s`;
            const active = sec === duration ? (startTime === 0 && endTime === duration) : clipDuration === sec;
            return (
              <button key={sec}
                onClick={() => { stopClip(); setStartTime(0); setEndTime(Math.min(sec, duration)); }}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: active ? 'var(--accent)' : 'rgba(255,255,255,0.05)', borderColor: active ? 'var(--accent)' : 'var(--bg-glass-border)', color: active ? 'white' : 'var(--text-secondary)' }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
        Type a time (e.g. <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>2:30</span>) or drag the sliders · Click the waveform to seek
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={isPlaying ? pauseClip : playClip} disabled={!loaded && !loadError}
          style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: loadError ? 'var(--text-muted)' : 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: loaded ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {isPlaying ? <HiPause size={15} /> : <HiPlay size={15} />}
          {loadError ? 'No audio' : loaded ? (isPlaying ? 'Pause' : 'Preview') : 'Loading…'}
        </button>
        <button
          onClick={() => {
            stopClip();
            onConfirm({ title: track.title, artist: track.artist, audioUrl: track.audioUrl, coverImage: track.coverImage, duration: track.duration, startTime, endTime });
          }}
          style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'var(--grad-brand)', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 0 16px var(--accent-glow)' }}>
          <HiCheck size={15} /> Attach {fmt(clipDuration)} clip
        </button>
      </div>
    </div>
  );
}

// ─── Main MusicSelector ────────────────────────────────────────────────────────
export default function MusicSelector({ onClose, onSelect, activeTrack }) {
  const [tracks,     setTracks]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [playingId,  setPlayingId]  = useState(null);   // track._id currently previewing
  const [trimTrack,  setTrimTrack]  = useState(null);
  const sessionId   = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchMusic('');
    return () => {
      // Stop any preview on unmount
      if (sessionId.current) { audioManager.stop(); sessionId.current = null; }
      clearTimeout(debounceRef.current);
    };
  }, []);

  // Listen for global stop so the playing indicator resets
  useEffect(() => {
    const onStop = (stoppedId) => {
      if (sessionId.current && stoppedId === sessionId.current) {
        sessionId.current = null;
        setPlayingId(null);
      }
    };
    audioManager.onStopAll(onStop);
    return () => audioManager.offStopAll(onStop);
  }, []);

  const fetchMusic = async (query) => {
    setLoading(true);
    try {
      const url = query ? `/music?search=${encodeURIComponent(query)}` : '/music';
      const { data } = await api.get(url);
      if (data.success) setTracks(data.music);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchMusic(val), 350);
  }, []);

  const stopPreview = () => {
    if (sessionId.current) { audioManager.stop(); sessionId.current = null; }
    setPlayingId(null);
  };

  const togglePreview = (e, track) => {
    e.preventDefault(); e.stopPropagation();

    // Clicking the same track that's playing → stop it
    if (playingId === track._id && sessionId.current && audioManager.isPlaying(sessionId.current)) {
      stopPreview();
      return;
    }

    // Start preview — audioManager stops any other audio automatically
    const id = audioManager.play(track.audioUrl, {
      onEnded:  () => { sessionId.current = null; setPlayingId(null); },
      onError:  () => { sessionId.current = null; setPlayingId(null); },
    });
    sessionId.current = id;
    setPlayingId(track._id);
  };

  const openTrimmer = (e, track) => {
    e.stopPropagation();
    stopPreview();
    setTrimTrack(track);
  };

  const handleSelect = (track) => {
    stopPreview();
    onSelect({ title: track.title, artist: track.artist, audioUrl: track.audioUrl, coverImage: track.coverImage, duration: track.duration, startTime: 0, endTime: track.duration });
    onClose();
  };

  const handleConfirmClip = (clipped) => {
    onSelect(clipped);
    onClose();
  };

  const handleClose = () => { stopPreview(); onClose(); };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, background: '#111', border: '1px solid var(--bg-glass-border)', borderRadius: 20, padding: 24, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        >
          <AnimatePresence mode="wait">
            {trimTrack ? (
              <motion.div key="trim" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.18 }}>
                <ClipTrimmer track={trimTrack} onConfirm={handleConfirmClip} onBack={() => setTrimTrack(null)} />
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <HiMusicNote style={{ color: 'var(--accent)' }} /> Select Vibe Music
                  </h3>
                  <button onClick={handleClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', borderRadius: 8, padding: 6, display: 'flex' }}>
                    <HiX size={18} />
                  </button>
                </div>

                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Search title, artist or genre..." value={search} onChange={handleSearchChange} className="input-vela" style={{ paddingLeft: 38, fontSize: 13 }} autoFocus />
                  {search && (
                    <button onClick={() => { setSearch(''); fetchMusic(''); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      <HiX size={14} />
                    </button>
                  )}
                </div>

                {!loading && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                    {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} {search ? `matching "${search}"` : 'available'} · Click to attach · ✂️ to clip
                  </p>
                )}

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)
                  ) : tracks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <HiMusicNote size={32} style={{ marginBottom: 12, opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 14, fontWeight: 600 }}>No tracks found</div>
                    </div>
                  ) : tracks.map(track => {
                    const isSelected = activeTrack?.audioUrl === track.audioUrl;
                    const isPlaying  = playingId === track._id;
                    return (
                      <div key={track._id} onClick={() => handleSelect(track)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: isSelected ? 'var(--accent-dim)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelected ? 'rgba(167,139,250,0.3)' : 'var(--bg-glass-border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      >
                        <div style={{ position: 'relative', width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={track.coverImage} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={e => togglePreview(e, track)}
                            style={{ position: 'absolute', inset: 0, background: isPlaying ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.stopPropagation(); }}
                            onMouseLeave={e => { e.currentTarget.style.background = isPlaying ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)'; }}
                          >
                            {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} style={{ marginLeft: 2 }} />}
                          </button>
                          {isPlaying && <div style={{ position: 'absolute', inset: 0, borderRadius: 8, boxShadow: '0 0 0 2px var(--accent)', pointerEvents: 'none' }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</span>
                            {isPlaying && <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: 20, flexShrink: 0 }}>♪ PLAYING</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</span>
                            {track.genre && <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>{track.genre}</span>}
                            {track.duration > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{fmt(track.duration)}</span>}
                          </div>
                        </div>

                        <button onClick={e => openTrimmer(e, track)} title="Set start/end clip"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--bg-glass-border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.color = 'var(--accent)'; e.stopPropagation(); }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <HiScissors size={14} />
                        </button>

                        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--bg-glass-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          {isSelected && <HiCheck size={14} color="white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
