import { NavLink } from 'react-router-dom';
import { HiHome, HiSparkles, HiPlus, HiChat, HiBell, HiUser } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useMessages } from '../../context/MessageContext.jsx';
import { useState } from 'react';
import CreateMomentModal from '../feed/CreateMomentModal.jsx';

export default function MobileNav() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadMsgCount } = useMessages();
  const [showCreate, setShowCreate] = useState(false);

  // 6 items: Home · Explore · + · Messages · Notifications · Profile
  const items = [
    { to: '/feed',          icon: HiHome },
    { to: '/explore',       icon: HiSparkles },
    { action: () => setShowCreate(true), icon: HiPlus, special: true },
    { to: '/messages',      icon: HiChat,  badge: unreadMsgCount, badgeColor: '#A78BFA' },
    { to: '/notifications', icon: HiBell,  badge: unreadCount,    badgeColor: '#EF4444' },
    { to: user ? `/profile/${user.username}` : '/login', icon: HiUser, isProfile: true, avatar: user?.profilePicture, username: user?.username },
  ];

  return (
    <>
      <nav
        className="mobile-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 62,
          background: 'rgba(12,10,16,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--bg-glass-border)',
          zIndex: 200,
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 4px',
        }}
      >
        {items.map((item, i) =>
          item.action ? (
            /* ── + Create button ── */
            <button
              key={i}
              onClick={item.action}
              style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'var(--grad-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px var(--accent-glow)',
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <item.icon size={22} color="white" />
            </button>
          ) : item.isProfile ? (
            /* ── Profile tab — avatar or user icon ── */
            <NavLink
              key={i}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44,
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                position: 'relative', flexShrink: 0,
              })}
            >
              {({ isActive }) =>
                item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.username}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                    }}
                  />
                ) : (
                  <item.icon size={22} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                )
              }
            </NavLink>
          ) : (
            /* ── Standard nav item ── */
            <NavLink
              key={i}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44,
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                position: 'relative', flexShrink: 0,
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                  {item.badge > 0 && (
                    <div style={{
                      position: 'absolute', top: 4, right: 2,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: item.badgeColor || '#EF4444',
                      color: 'white', fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                      border: '1.5px solid rgba(12,10,16,0.97)',
                    }}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

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
