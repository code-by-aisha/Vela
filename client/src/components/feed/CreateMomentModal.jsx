import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPhotograph, HiMusicNote, HiEmojiHappy, HiHashtag, HiUpload } from 'react-icons/hi';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import MusicSelector from '../common/MusicSelector.jsx';

const MOODS = ['Aesthetic', 'Calm', 'Energetic', 'Thoughtful', 'Creative', 'Personal', 'Emotional'];
const MOOD_EMOJI = { Aesthetic: '✨', Calm: '🌊', Energetic: '⚡', Thoughtful: '💭', Creative: '🎨', Personal: '💫', Emotional: '🌙' };

export default function CreateMomentModal({ onClose, onCreated, initialCaption = '' }) {
  const [caption, setCaption] = useState(initialCaption);
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const fileRef = useRef();

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    const prevs = selected.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' }));
    setPreviews(prevs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      if (mood) formData.append('mood', mood);
      if (tags) formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)));
      if (music) formData.append('music', JSON.stringify(music));
      files.forEach(f => formData.append('media', f));

      const { data } = await api.post('/moments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Moment shared! ✨');
        onCreated?.(data.moment);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create Moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 560,
            background: '#111111',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-xl)',
            maxHeight: '90vh', overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--bg-glass-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Create Moment</h2>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer' }}>
              <HiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Caption */}
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Share your vibe..."
              className="input-vela"
              style={{ minHeight: 100, resize: 'vertical', paddingTop: '12px' }}
            />

            {/* Media upload */}
            <div>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
              {previews.length === 0 ? (
                <button type="button" onClick={() => fileRef.current.click()} style={{
                  width: '100%', padding: '32px', borderRadius: 'var(--radius-lg)',
                  border: '2px dashed var(--bg-glass-border)',
                  background: 'var(--bg-glass)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                  color: 'var(--text-muted)', transition: 'all var(--transition-base)',
                }}>
                  <HiUpload size={28} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Drop media or click to browse</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Images & videos supported</div>
                  </div>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 100, height: 100 }}>
                      {p.type === 'video' ? (
                        <video src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current.click()} style={{
                    width: 100, height: 100, borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--bg-glass-border)', background: 'var(--bg-glass)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <HiPhotograph size={24} />
                  </button>
                </div>
              )}
            </div>

            {/* Mood selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <HiEmojiHappy style={{ display: 'inline', marginRight: 6 }} /> Select Mood
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(mood === m ? '' : m)}
                    className={`mood-badge mood-${m}`}
                    style={{
                      cursor: 'pointer',
                      opacity: mood && mood !== m ? 0.4 : 1,
                      border: mood === m ? '2px solid currentColor' : undefined,
                    }}
                  >
                    {MOOD_EMOJI[m]} {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <HiHashtag style={{ display: 'inline', marginRight: 6 }} /> Tags (comma separated)
              </label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="travel, design, photography..."
                className="input-vela"
                style={{ fontSize: '13px' }}
              />
            </div>

            {/* Music Selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <HiMusicNote size={16} style={{ color: 'var(--aqua)' }} /> Music Soundtrack
                </label>
                {music && (
                  <button
                    type="button"
                    onClick={() => setMusic(null)}
                    style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {music ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-glass-border)',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)'
                }}>
                  {music.coverImage && (
                    <img src={music.coverImage} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{music.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>{music.artist}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMusicSelector(true)}
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px', fontSize: '11px', minHeight: '30px' }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMusicSelector(true)}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                >
                  <HiMusicNote size={16} /> Choose a Sound Vibe
                </button>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '14px', borderRadius: 'var(--radius-md)',
                background: loading ? 'var(--bg-glass)' : 'var(--grad-brand)',
                color: 'white', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: '15px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 20px var(--accent-glow)',
              }}
            >
              {loading ? 'Sharing...' : 'Share Moment ✨'}
            </motion.button>
          </form>
          {showMusicSelector && (
            <MusicSelector
              onClose={() => setShowMusicSelector(false)}
              onSelect={(selected) => setMusic(selected)}
              activeTrack={music}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
