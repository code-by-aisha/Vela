import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiTrash, HiBell } from 'react-icons/hi';
import { useNotifications } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';

const TYPE_ICON = { follow:'👤', reaction:'✨', comment:'💬', message:'📩', story_view:'👁️', mention:'📣' };
const TYPE_COLOR = { follow:'#A78BFA', reaction:'#F472B6', comment:'#34D399', message:'#60A5FA', story_view:'#FBBF24', mention:'#FB923C' };

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationsPage() {
  const { notifications, setNotifications, markAllRead, markRead, setUnreadCount } = useNotifications();

  // Mark all as read when the page opens
  useEffect(() => {
    markAllRead();
  }, []);

  const deleteOne = async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try { await api.delete(`/notifications/${id}`); } catch {}
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await api.delete('/notifications/all'); } catch {}
  };

  const unread = notifications.filter(n => !n.isRead);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: 0 }}>Notifications</h1>
          {unread.length > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 700 }}>{unread.length}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <HiBell size={56} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>You're all caught up!</p>
          <p style={{ fontSize: 13 }}>Notifications from follows, reactions, and comments will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {notifications.map(notif => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
                exit={{ opacity: 0, x: 40 }}
                onClick={() => !notif.isRead && markRead(notif._id)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: notif.isRead ? 'var(--bg-elevated)' : 'rgba(167,139,250,0.06)',
                  border: `1px solid ${notif.isRead ? 'var(--bg-glass-border)' : 'rgba(167,139,250,0.15)'}`,
                  cursor: notif.isRead ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {/* Unread dot */}
                {!notif.isRead && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
                )}

                {/* Type icon */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${TYPE_COLOR[notif.type]}18`, border: `1px solid ${TYPE_COLOR[notif.type]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {TYPE_ICON[notif.type] || '🔔'}
                </div>

                {/* Sender avatar */}
                {notif.sender && (
                  notif.sender.profilePicture ? (
                    <img src={notif.sender.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {notif.sender.username?.[0]?.toUpperCase()}
                    </div>
                  )
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    {notif.sender && (
                      <Link to={`/profile/${notif.sender.username}`} style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>@{notif.sender.username} </Link>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>{notif.message?.replace(notif.sender?.username + ' ', '') || 'interacted with you'}</span>
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(notif.createdAt)}</span>
                  {notif.moment?.media?.[0]?.url && (
                    <Link to={`/moment/${notif.moment._id}`} style={{ display: 'block', marginTop: 8 }}>
                      <img src={notif.moment.media[0].url} alt="" style={{ height: 60, width: 80, objectFit: 'cover', borderRadius: 8 }} />
                    </Link>
                  )}
                </div>

                <button onClick={(e) => { e.stopPropagation(); deleteOne(notif._id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
                  <HiTrash size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
