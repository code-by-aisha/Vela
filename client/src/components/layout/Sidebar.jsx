import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHome, HiSparkles, HiChat, HiBookmark, HiBell, HiUser, HiCog,
  HiPlus, HiPhotograph
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useMessages } from '../../context/MessageContext.jsx';
import { VelaLogo } from '../common/LoadingScreen.jsx';
import CreateMomentModal from '../feed/CreateMomentModal.jsx';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications() || { unreadCount: 0 };
  const { unreadMsgCount } = useMessages();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const NAV_ITEMS = [
    { to: '/feed',          icon: HiHome,        label: 'Home' },
    { to: '/explore',       icon: HiSparkles,    label: 'Explore' },
    { to: '/stories',       icon: HiPhotograph,  label: 'Stories' },
    { to: '/messages',      icon: HiChat,        label: 'Messages',      msgBadge: true },
    { to: '/notifications', icon: HiBell,        label: 'Notifications', badge: true },
    { to: '/collections',   icon: HiBookmark,    label: 'Collections' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('See you soon! ✨');
    } catch {
      toast.error('Logout failed.');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop glass-elevated" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 'var(--sidebar-width)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        borderRight: '1px solid var(--bg-glass-border)',
        zIndex: 100,
        gap: '8px',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '8px 12px 24px' }}>
          <VelaLogo size={32} />
        </div>

        {/* Nav - Desktop */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge, msgBadge }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              border: isActive ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
              transition: 'all var(--transition-base)',
              textDecoration: 'none',
              cursor: 'pointer',
            })}>
              {({ isActive }) => (
                <>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                    {badge && unreadCount > 0 && (
                      <div style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--bg-surface)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                    {msgBadge && unreadMsgCount > 0 && (
                      <div style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: '#A78BFA', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--bg-surface)' }}>
                        {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                      </div>
                    )}
                  </div>
                  <span className="d-lg-inline d-xl-inline">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Create Moment - Desktop */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'var(--grad-brand)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginTop: '12px',
              boxShadow: '0 0 20px var(--accent-glow)',
              letterSpacing: '0.02em',
              justifyContent: 'center',
              transition: 'all var(--transition-base)',
            }}
            className="btn-create-desktop"
          >
            <HiPlus size={20} />
            <span className="d-lg-inline">Create Moment</span>
          </motion.button>
        </nav>

        {/* Profile bottom - Desktop */}
        {user && (
          <div style={{ borderTop: '1px solid var(--bg-glass-border)', paddingTop: '16px' }}>
            <NavLink to={`/profile/${user.username}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
              textDecoration: 'none',
            }}>
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.username}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--grad-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, color: 'white',
                  flexShrink: 0,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }} className="d-lg-block">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  @{user.username}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>{user.aura}</div>
              </div>
            </NavLink>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <NavLink to="/settings" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '6px', padding: '8px', borderRadius: 'var(--radius-md)',
                fontSize: '12px', color: 'var(--text-muted)',
                background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
                textDecoration: 'none',
              }}>
                <HiCog size={14} /> <span className="d-lg-inline">Settings</span>
              </NavLink>
              <button onClick={handleLogout} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-md)',
                fontSize: '12px', color: 'var(--text-muted)',
                background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
                cursor: 'pointer',
              }}>
                <span className="d-lg-inline">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {showCreate && (
        <CreateMomentModal
          onClose={() => setShowCreate(false)}
          onCreated={(moment) => {
            setShowCreate(false);
            window.dispatchEvent(new CustomEvent('vela:moment-created', { detail: moment }));
          }}
        />
      )}
    </>
  );
}
