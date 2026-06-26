import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiSearch } from 'react-icons/hi';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

function UserRow({ u, currentUser, onNavigate }) {
  const [following, setFollowing] = useState(
    currentUser?.following?.some(f => (f._id || f) === u._id)
  );
  const [loading, setLoading] = useState(false);
  const isMe = currentUser?._id === u._id;

  const toggle = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/users/${u._id}/follow`);
      setFollowing(prev => !prev);
    } catch {
      toast.error('Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    onNavigate(`/messages/${u._id}`);
  };

  return (
    <div
      onClick={() => onNavigate(`/profile/${u.username}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', cursor: 'pointer',
        transition: 'background 0.15s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {u.profilePicture ? (
          <img src={u.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>
            {u.username?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          @{u.username}
        </div>
        {u.aura && (
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{u.aura}</div>
        )}
      </div>

      {/* Actions */}
      {!isMe && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={handleMessage}
            style={{
              padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
              color: 'var(--accent)', cursor: 'pointer',
            }}
          >
            Message
          </button>
          <button
            onClick={toggle}
            disabled={loading}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: following ? 'transparent' : 'var(--grad-brand)',
              border: following ? '1px solid rgba(255,255,255,0.15)' : 'none',
              color: following ? 'var(--text-muted)' : 'white',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {following ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function FollowersModal({ userId, mode = 'followers', isHidden = false, onClose }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userId || isHidden) return;   // don't fetch if hidden
    setLoading(true);
    api.get(`/users/${userId}/${mode}`)
      .then(({ data }) => { if (data.success) setUsers(data.users || []); })
      .catch(() => toast.error('Could not load list.'))
      .finally(() => setLoading(false));
  }, [userId, mode, isHidden]);

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 420,
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 20,
            overflow: 'hidden',
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--bg-glass-border)',
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {mode === 'followers' ? 'Followers' : 'Following'}
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                {users.length}
              </span>
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <HiX size={20} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', borderRadius: 10, padding: '8px 12px' }}>
              <HiSearch size={15} color="var(--text-muted)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {isHidden ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔒</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    This list is private
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                    This user's {mode === 'followers' ? 'followers list' : 'following list'} is not visible to others.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {search ? 'No results' : mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </div>
            ) : (
              filtered.map(u => (
                <UserRow key={u._id} u={u} currentUser={currentUser} onNavigate={handleNavigate} />
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
