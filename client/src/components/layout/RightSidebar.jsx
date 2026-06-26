import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiTrendingUp, HiUserAdd, HiStar, HiLightningBolt } from 'react-icons/hi';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function RightSidebar() {
  const [suggested, setSuggested] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, tagsRes] = await Promise.all([
          api.get('/users/suggested'),
          api.get('/search/trending-tags'),
        ]);
        if (usersRes.data.success) setSuggested(usersRes.data.users.slice(0, 5));
        if (tagsRes.data.success) setTrendingTags(tagsRes.data.tags.slice(0, 8));
      } catch {}
    };
    load();
  }, []);

  const handleFollow = async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      if (data.following) {
        setFollowing(prev => new Set([...prev, userId]));
        toast.success('Following! ✨');
      } else {
        setFollowing(prev => { const s = new Set(prev); s.delete(userId); return s; });
      }
    } catch {
      toast.error('Could not follow.');
    }
  };

  return (
    <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Mini profile */}
      {user && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          {user.coverPhoto && (
            <img src={user.coverPhoto} alt="" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
          )}
          <div style={{ padding: '12px 16px 16px' }}>
            <Link to={`/profile/${user.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: 'white' }}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>@{user.username}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>{user.aura}</div>
              </div>
            </Link>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--bg-glass-border)' }}>
              {[
                { label: 'Following', val: user.following?.length || 0 },
                { label: 'Followers', val: user.followers?.length || 0 },
                { label: 'Vibe', val: user.vibeScore || 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.04, ease: [0.25,0.4,0.25,1] }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HiTrendingUp style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>Trending Moods</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trendingTags.map((tag, i) => (
              <div key={tag._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>#{tag._id}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tag.count} Moments</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Suggested Users */}
      {suggested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.08, ease: [0.25,0.4,0.25,1] }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HiStar style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>Suggested Creators</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {suggested.map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to={`/profile/${u.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--bg-glass-border)' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {u.username[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent)' }}>{u.aura}</div>
                  </div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFollow(u._id)}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                    fontSize: '12px', fontWeight: 600,
                    background: following.has(u._id) ? 'var(--bg-glass)' : 'var(--accent-dim)',
                    border: `1px solid ${following.has(u._id) ? 'var(--bg-glass-border)' : 'rgba(167,139,250,0.3)'}`,
                    color: following.has(u._id) ? 'var(--text-secondary)' : 'var(--accent)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {following.has(u._id) ? 'Following' : 'Follow'}
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Vibe Rankings */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.12, ease: [0.25,0.4,0.25,1] }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <HiLightningBolt style={{ color: '#FB923C' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>Aura Levels</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { aura: 'Visionary Aura', score: '500+', color: '#A78BFA' },
            { aura: 'Trendsetter Aura', score: '300+', color: '#86BBBD' },
            { aura: 'Creative Aura', score: '200+', color: '#34D399' },
            { aura: 'Storyteller Aura', score: '100+', color: '#60A5FA' },
            { aura: 'Explorer Aura', score: '50+', color: '#F472B6' },
          ].map(({ aura, score, color }) => (
            <div key={aura} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color, fontWeight: 600 }}>{aura}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{score} pts</span>
            </div>
          ))}
        </div>
      </motion.div>

    </aside>
  );
}
