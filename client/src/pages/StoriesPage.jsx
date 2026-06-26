import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiUpload, HiMusicNote } from 'react-icons/hi';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import StoriesBar from '../components/stories/StoriesBar.jsx';
import MusicSelector from '../components/common/MusicSelector.jsx';

const MOODS = ['Aesthetic', 'Calm', 'Energetic', 'Thoughtful', 'Creative', 'Personal', 'Emotional'];
const MOOD_EMOJI = { Aesthetic: '✨', Calm: '🌊', Energetic: '⚡', Thoughtful: '💭', Creative: '🎨', Personal: '💫', Emotional: '🌙' };

export default function StoriesPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mood, setMood] = useState('');
  const [text, setText] = useState('');
  const [music, setMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select media for your story.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      if (mood) fd.append('mood', mood);
      if (text) fd.append('text', text);
      if (music) fd.append('music', JSON.stringify(music));

      const { data } = await api.post('/stories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        toast.success('Story created! ✨');
        setFile(null); setPreview(null); setMood(''); setText(''); setMusic({ title: '', artist: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Stories</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Stories disappear after 24 hours ✨</p>

      {/* Active stories */}
      <StoriesBar />

      {/* Create story */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-xl)', padding: 24, marginTop: 8 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Create Story</h2>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Media */}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
          {!preview ? (
            <button type="button" onClick={() => fileRef.current.click()} style={{
              width: '100%', height: 200, borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--bg-glass-border)', background: 'var(--bg-glass)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text-muted)',
            }}>
              <HiUpload size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Upload Story Media</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Images & videos · Expires in 24h</div>
              </div>
            </button>
          ) : (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '9/16', maxHeight: 400 }}>
              {preview.type === 'video' ? (
                <video src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
              ) : (
                <img src={preview.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                Change
              </button>
            </div>
          )}

          {/* Caption text */}
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add text to your story..."
            className="input-vela"
            maxLength={200}
          />

          {/* Mood */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Mood</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setMood(mood === m ? '' : m)}
                  className={`mood-badge mood-${m}`}
                  style={{ cursor: 'pointer', opacity: mood && mood !== m ? 0.4 : 1, border: mood === m ? '2px solid currentColor' : undefined }}>
                  {MOOD_EMOJI[m]} {m}
                </button>
              ))}
            </div>
          </div>

          {/* Music Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <HiMusicNote size={15} style={{ color: 'var(--aqua)' }} /> Music Soundtrack
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
                <HiMusicNote size={15} /> Choose a Sound Vibe
              </button>
            )}
          </div>

          <motion.button type="submit" disabled={loading || !file} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              padding: 14, borderRadius: 'var(--radius-md)',
              background: !file || loading ? 'var(--bg-glass)' : 'var(--grad-brand)',
              color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: !file || loading ? 'not-allowed' : 'pointer',
              boxShadow: !file || loading ? 'none' : '0 0 20px var(--accent-glow)',
            }}>
            {loading ? 'Uploading...' : 'Share Story ✨'}
          </motion.button>
        </form>
      </div>
      {showMusicSelector && (
        <MusicSelector
          onClose={() => setShowMusicSelector(false)}
          onSelect={(selected) => setMusic(selected)}
          activeTrack={music}
        />
      )}
    </div>
  );
}
