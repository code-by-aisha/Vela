import { useState, useRef, useEffect } from 'react';
import { HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiMusicNote } from 'react-icons/hi';
import audioManager from '../../utils/audioManager.js';

export default function MusicPlayer({ audioUrl, title, artist, coverImage, inline = false, startTime = 0, endTime = null }) {
  const sessionId     = useRef(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [muted,       setMuted]       = useState(false);
  const [loadError,   setLoadError]   = useState(false);

  // Pre-fetch duration for the seek bar
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(startTime);
    setLoadError(false);
    if (sessionId.current) { audioManager.stop(); sessionId.current = null; }

    let audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;
    const onMeta = () => { setDuration(audio.duration || 0); };
    const onErr  = () => { setLoadError(true); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('error', onErr);
      audio = null;
    };
  }, [audioUrl, startTime]);

  // Listen for global stop events (another player started)
  useEffect(() => {
    const onStop = (stoppedId) => {
      if (sessionId.current && stoppedId === sessionId.current) {
        sessionId.current = null;
        setIsPlaying(false);
        setCurrentTime(startTime);
      }
    };
    audioManager.onStopAll(onStop);
    return () => {
      if (sessionId.current) { audioManager.stop(); sessionId.current = null; }
      audioManager.offStopAll(onStop);
    };
  }, [startTime]);

  const clipEnd = endTime || duration;

  const togglePlay = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!audioUrl) return;

    if (isPlaying && sessionId.current && audioManager.isPlaying(sessionId.current)) {
      audioManager.pause(sessionId.current);
      setIsPlaying(false);
      return;
    }

    if (sessionId.current && audioManager.isActive(sessionId.current) && !audioManager.isPlaying(sessionId.current)) {
      audioManager.resume(sessionId.current);
      setIsPlaying(true);
      return;
    }

    const id = audioManager.play(audioUrl, {
      startTime,
      endTime: clipEnd || null,
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
    setLoadError(false);
  };

  const handleSeek = (e) => {
    const t = Math.max(startTime, Math.min(Number(e.target.value), clipEnd || duration));
    setCurrentTime(t);
    if (sessionId.current) audioManager.seek(sessionId.current, t);
  };

  const toggleMute = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (sessionId.current) audioManager.setMuted(sessionId.current, next);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const displayDuration = clipEnd || duration;
  const progressPct = displayDuration > startTime
    ? ((currentTime - startTime) / (displayDuration - startTime)) * 100
    : 0;

  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 999, border: '1px solid var(--bg-glass-border)', width: 'fit-content', maxWidth: '100%' }}>
        <button onClick={togglePlay} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 }}>
          {isPlaying ? <HiPause size={11} /> : <HiPlay size={11} style={{ marginLeft: 1 }} />}
        </button>
        <div style={{ fontSize: 12, fontWeight: 600, color: loadError ? '#EF4444' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loadError ? '⚠ Could not load' : <><span>{title}</span><span style={{ color: 'var(--text-muted)' }}> · {artist}</span></>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', width: '100%', backdropFilter: 'blur(10px)' }}>
      {coverImage
        ? <img src={coverImage} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
        : <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HiMusicNote size={20} color="white" /></div>
      }

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: loadError ? '#EF4444' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loadError ? '⚠ Audio unavailable' : title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{artist}</div>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
            {fmt(currentTime - startTime)} / {fmt(displayDuration - startTime)}
          </span>
        </div>

        {!loadError && (
          <div style={{ marginTop: 8 }}>
            <input
              type="range"
              min={startTime}
              max={displayDuration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{ width: '100%', height: 3, borderRadius: 2, outline: 'none', cursor: 'pointer', accentColor: 'var(--accent)', background: `linear-gradient(to right, var(--accent) ${progressPct}%, rgba(255,255,255,0.08) ${progressPct}%)` }}
            />
          </div>
        )}
      </div>

      {!loadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={toggleMute} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
            {muted ? <HiVolumeOff size={16} /> : <HiVolumeUp size={16} />}
          </button>
          <button
            onClick={togglePlay}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: isPlaying ? '0 0 12px var(--accent-glow)' : 'none', flexShrink: 0 }}
          >
            {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} style={{ marginLeft: 2 }} />}
          </button>
        </div>
      )}
    </div>
  );
}
