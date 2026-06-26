/**
 * audioManager.js — Global singleton audio manager for VELA.
 *
 * Guarantees only ONE track ever plays at a time across the entire app:
 *   MomentCard InlineMusicPlayer, MusicPlayer (full/inline), MusicSelector
 *   previews, ClipTrimmer, and ReelCard background audio all share this.
 *
 * Usage:
 *   import audioManager from '../utils/audioManager.js';
 *
 *   const id = audioManager.play(url, { onEnded, onError, startTime, endTime });
 *   audioManager.pause(id);
 *   audioManager.stop();          // stops everything
 *   audioManager.isPlaying(id);   // boolean
 *   audioManager.onStopAll(cb);   // register a listener for global stop events
 *   audioManager.offStopAll(cb);  // remove that listener
 */

class AudioManager {
  constructor() {
    this._current = null;   // { id, audio, url, startTime, endTime, callbacks }
    this._idCounter = 0;
    this._stopListeners = new Set();
  }

  /** Generate a unique ID for each play session */
  _nextId() {
    return `vela-audio-${++this._idCounter}`;
  }

  /**
   * Start playing a URL.  Stops any currently playing track first.
   *
   * @param {string} url
   * @param {object} opts
   *   startTime  {number}   clip start in seconds (default 0)
   *   endTime    {number}   clip end in seconds (default full duration)
   *   volume     {number}   0–1 (default 1)
   *   loop       {boolean}  default false
   *   onEnded    {Function} called when clip finishes naturally
   *   onError    {Function} called on load/play error
   *   onTimeUpdate {Function} called with currentTime on each timeupdate
   * @returns {string} playback ID — use to check / pause / stop this session
   */
  play(url, opts = {}) {
    const {
      startTime = 0,
      endTime = null,
      volume = 1,
      loop = false,
      onEnded = null,
      onError = null,
      onTimeUpdate = null,
    } = opts;

    // Stop whatever is currently playing (fires _stopListeners)
    this._stopCurrent();

    const id = this._nextId();
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audio.loop = loop;
    audio.src = url;

    const session = { id, audio, url, startTime, endTime, callbacks: { onEnded, onError, onTimeUpdate } };
    this._current = session;

    // --- internal event handlers ---
    const handleTimeUpdate = () => {
      if (!this._current || this._current.id !== id) return;
      if (onTimeUpdate) onTimeUpdate(audio.currentTime);

      const end = endTime != null ? endTime : audio.duration;
      if (end && audio.currentTime >= end) {
        audio.pause();
        audio.currentTime = startTime;
        if (this._current?.id === id) {
          this._current = null;
          this._notifyStop(id);
        }
        if (onEnded) onEnded();
      }
    };

    const handleEnded = () => {
      if (!this._current || this._current.id !== id) return;
      audio.currentTime = startTime;
      if (this._current?.id === id) {
        this._current = null;
        this._notifyStop(id);
      }
      if (onEnded) onEnded();
    };

    const handleError = () => {
      if (!this._current || this._current.id !== id) return;
      this._current = null;
      this._notifyStop(id);
      if (onError) onError();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Store cleanup so _stopCurrent can remove them
    session._cleanup = () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };

    // Seek to start and play
    audio.currentTime = startTime;
    audio.play().catch(() => {
      if (onError) onError();
      if (this._current?.id === id) {
        this._current = null;
        this._notifyStop(id);
      }
    });

    return id;
  }

  /**
   * Pause the session with the given id (no-op if it's not the active one).
   */
  pause(id) {
    if (!this._current || this._current.id !== id) return;
    this._current.audio.pause();
    // Don't clear _current — pause is resumable via resume()
  }

  /**
   * Resume a paused session.
   */
  resume(id) {
    if (!this._current || this._current.id !== id) return;
    this._current.audio.play().catch(() => {});
  }

  /**
   * Stop everything.  Clears _current and notifies all stop listeners.
   */
  stop() {
    this._stopCurrent();
  }

  /**
   * Returns true if the given session id is the currently active (and not paused) one.
   */
  isPlaying(id) {
    if (!this._current || this._current.id !== id) return false;
    return !this._current.audio.paused;
  }

  /**
   * Returns true if the given session id is the active session (playing OR paused).
   */
  isActive(id) {
    return !!(this._current && this._current.id === id);
  }

  /**
   * Get current playback time for the active session.
   */
  getCurrentTime(id) {
    if (!this._current || this._current.id !== id) return 0;
    return this._current.audio.currentTime;
  }

  /**
   * Seek within the active session.
   */
  seek(id, time) {
    if (!this._current || this._current.id !== id) return;
    this._current.audio.currentTime = time;
  }

  /**
   * Set volume for the active session (0–1).
   */
  setVolume(id, vol) {
    if (!this._current || this._current.id !== id) return;
    this._current.audio.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Set muted for the active session.
   */
  setMuted(id, muted) {
    if (!this._current || this._current.id !== id) return;
    this._current.audio.muted = muted;
  }

  /**
   * Register a callback that fires whenever any audio is stopped.
   * Receives the stopped session id (or null for a manual stop()).
   */
  onStopAll(cb) {
    this._stopListeners.add(cb);
  }

  offStopAll(cb) {
    this._stopListeners.delete(cb);
  }

  // ── private ────────────────────────────────────────────────────────────────

  _stopCurrent() {
    if (!this._current) return;
    const { id, audio } = this._current;
    audio.pause();
    if (this._current._cleanup) this._current._cleanup();
    this._current = null;
    this._notifyStop(id);
  }

  _notifyStop(id) {
    this._stopListeners.forEach(cb => { try { cb(id); } catch {} });
  }
}

// Export a single shared instance
const audioManager = new AudioManager();
export default audioManager;
