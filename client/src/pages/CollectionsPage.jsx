import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiBookmark, HiPhotograph } from 'react-icons/hi';
import api from '../utils/api.js';

export default function CollectionsPage() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/moments/saved').then(({ data }) => {
      if (data.success) setSaved(data.moments);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <HiBookmark style={{ color: 'var(--accent)', fontSize: 22 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Saved Moments</h1>
        {saved.length > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{saved.length} saved</span>}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No saved Moments yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Save Moments from your feed to find them here.
          </p>
          <Link to="/explore" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>Explore Moments</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {saved.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/moment/${m._id}`} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.02 }} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', position: 'relative', background: 'var(--bg-elevated)' }}>
                  {m.media?.[0]?.type === 'video' ? (
                    <video src={m.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : m.media?.[0] ? (
                    <img src={m.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'linear-gradient(135deg, var(--mauve), var(--slate))', opacity: 0.6 }}>
                      <p style={{ fontSize: 12, color: 'white', textAlign: 'center' }}>{m.caption?.slice(0, 60)}</p>
                    </div>
                  )}
                  {/* Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)', opacity: 0, transition: 'opacity 0.2s' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>@{m.author?.username}</div>
                  </div>
                  {m.mood && (
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span className={`mood-badge mood-${m.mood}`} style={{ fontSize: 9, padding: '2px 7px' }}>{m.mood}</span>
                    </div>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
