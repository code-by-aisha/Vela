import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCamera, HiSave, HiLockClosed, HiShieldCheck, HiBell,
  HiChat, HiEye, HiEyeOff, HiUser, HiLogout, HiTrash,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, sublabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 46, height: 26, borderRadius: 13, cursor: 'pointer', flexShrink: 0, position: 'relative',
          background: value ? 'var(--grad-brand)' : 'rgba(255,255,255,0.1)',
          transition: 'background 0.2s',
          boxShadow: value ? '0 0 12px rgba(167,139,250,0.3)' : 'none',
        }}
      >
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        />
      </div>
    </div>
  );
}

// ─── Select Option ────────────────────────────────────────────────────────────
function SelectOption({ label, sublabel, value, onChange, options }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
          {sublabel && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: value === opt.value ? 'var(--grad-brand)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${value === opt.value ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              color: value === opt.value ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              boxShadow: value === opt.value ? '0 0 12px rgba(167,139,250,0.25)' : 'none',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-xl)', padding: 'clamp(16px, 4vw, 24px)', marginBottom: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
        {Icon && <Icon style={{ color: 'var(--accent)', flexShrink: 0 }} size={17} />} {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', borderRadius: 12, flexShrink: 0,
        background: active ? 'var(--accent-dim)' : 'transparent',
        border: active ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
        minHeight: 40,
      }}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, refetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');

  // Profile
  const [bio, setBio] = useState(user?.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const profileRef = useRef();
  const coverRef = useRef();

  // Password
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });

  // Privacy settings — loaded from user object
  const [privacy, setPrivacy] = useState({
    allowMessagesFrom:  user?.settings?.allowMessagesFrom  ?? 'everyone',
    showFollowers:      user?.settings?.showFollowers      ?? true,
    showFollowing:      user?.settings?.showFollowing      ?? true,
    showOnlineStatus:   user?.settings?.showOnlineStatus   ?? true,
    isPrivateAccount:   user?.settings?.isPrivateAccount   ?? false,
    emailNotifications: user?.settings?.emailNotifications ?? true,
    notificationSound:  user?.settings?.notificationSound  ?? true,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const updatePrivacy = (key, val) => setPrivacy(p => ({ ...p, [key]: val }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bio', bio);
      fd.append('username', username);
      if (profileFile) fd.append('profilePicture', profileFile);
      if (coverFile) fd.append('coverPhoto', coverFile);
      const { data } = await api.put('/users/profile/update', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) { toast.success('Profile updated! ✨'); await refetchUser(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally { setSaving(false); }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const { data } = await api.put('/users/settings/privacy', privacy);
      if (data.success) { toast.success('Privacy settings saved! 🔒'); await refetchUser(); }
    } catch {
      toast.error('Could not save settings.');
    } finally { setSavingPrivacy(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match.');
    if (passwords.newPass.length < 6) return toast.error('Password must be at least 6 characters.');
    setChangingPass(true);
    try {
      const { data } = await api.put('/auth/update-password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      if (data.success) { toast.success('Password updated!'); setPasswords({ current: '', newPass: '', confirm: '' }); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password.');
    } finally { setChangingPass(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully.');
  };

  const TABS = [
    { key: 'profile',  icon: HiUser,        label: 'Profile' },
    { key: 'privacy',  icon: HiShieldCheck, label: 'Privacy' },
    { key: 'messages', icon: HiChat,        label: 'Messages' },
    { key: 'notifs',   icon: HiBell,        label: 'Notifications' },
    { key: 'security', icon: HiLockClosed,  label: 'Security' },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(16px, 4vw, 24px) clamp(12px, 4vw, 16px) 80px', width: '100%' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 800, marginBottom: 20 }}>Settings</h1>

      {/* Tab bar — scrollable on mobile, no tab clipping */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label} />
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <SectionCard title="Your Profile" icon={HiUser}>
            {/* Cover photo */}
            <div style={{ position:'relative', height:110, borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-glass)', marginBottom:16, cursor:'pointer' }} onClick={() => coverRef.current.click()}>
              {(coverPreview || user?.coverPhoto) && <img src={coverPreview || user.coverPhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)' }}>
                {!coverPreview && !user?.coverPhoto && <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'var(--text-muted)' }}><HiCamera size={22}/><span style={{ fontSize:12 }}>Click to set cover photo</span></div>}
                {(coverPreview || user?.coverPhoto) && <HiCamera size={24} color="white" style={{ opacity:0.8 }} />}
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f));} }} style={{ display:'none' }} />

            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ position:'relative', cursor:'pointer' }} onClick={() => profileRef.current.click()}>
                {(profilePreview || user?.profilePicture) ? (
                  <img src={profilePreview || user.profilePicture} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--accent)' }} />
                ) : (
                  <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'white' }}>{user?.username?.[0]?.toUpperCase()}</div>
                )}
                <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-elevated)' }}>
                  <HiCamera size={12} color="white" />
                </div>
              </div>
              <input ref={profileRef} type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setProfileFile(f);setProfilePreview(URL.createObjectURL(f));} }} style={{ display:'none' }} />
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{user?.username}</div>
                <div style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>{user?.aura}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Click avatar to change photo</div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input-vela" placeholder="your_username" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="input-vela" placeholder="Share your vibe..." maxLength={160} style={{ minHeight:80, resize:'vertical' }} />
                <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right', marginTop:3 }}>{bio.length}/160</div>
              </div>
              <motion.button type="submit" disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ padding:'12px', borderRadius:'var(--radius-md)', background:saving?'var(--bg-glass)':'var(--grad-brand)', color:'white', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, border:'none', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, justifyContent:'center', boxShadow:saving?'none':'0 0 16px var(--accent-glow)' }}>
                <HiSave size={16}/>{saving?'Saving...':'Save Profile'}
              </motion.button>
            </form>
          </SectionCard>

          {/* Danger zone */}
          <SectionCard title="Account" icon={HiLogout}>
            <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', borderRadius:'var(--radius-md)', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontWeight:600, fontSize:14, cursor:'pointer', marginTop:4 }}>
              <HiLogout size={18}/> Sign Out
            </button>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Privacy tab ── */}
      {tab === 'privacy' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <SectionCard title="Privacy Settings" icon={HiShieldCheck}>
            <Toggle
              value={privacy.isPrivateAccount}
              onChange={v => updatePrivacy('isPrivateAccount', v)}
              label="Private Account"
              sublabel="Only approved followers can see your Moments and Stories"
            />
            <Toggle
              value={privacy.showFollowers}
              onChange={v => updatePrivacy('showFollowers', v)}
              label="Show Followers List"
              sublabel="Allow others to see who follows you"
            />
            <Toggle
              value={privacy.showFollowing}
              onChange={v => updatePrivacy('showFollowing', v)}
              label="Show Following List"
              sublabel="Allow others to see who you follow"
            />
            <Toggle
              value={privacy.showOnlineStatus}
              onChange={v => updatePrivacy('showOnlineStatus', v)}
              label="Show Online Status"
              sublabel="Let others see when you are active"
            />
            <div style={{ paddingTop: 20 }}>
              <motion.button onClick={handleSavePrivacy} disabled={savingPrivacy} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ padding:'12px', borderRadius:'var(--radius-md)', background:savingPrivacy?'var(--bg-glass)':'var(--grad-brand)', color:'white', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', width:'100%', boxShadow:'0 0 16px var(--accent-glow)' }}>
                {savingPrivacy ? 'Saving...' : 'Save Privacy Settings 🔒'}
              </motion.button>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Messages tab ── */}
      {tab === 'messages' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <SectionCard title="Message Preferences" icon={HiChat}>
            <SelectOption
              label="Who can message you"
              sublabel="Control who can send you direct messages"
              value={privacy.allowMessagesFrom}
              onChange={v => updatePrivacy('allowMessagesFrom', v)}
              options={[
                { value: 'everyone',  label: '🌍 Everyone' },
                { value: 'followers', label: '👤 Followers only' },
                { value: 'nobody',    label: '🔒 Nobody' },
              ]}
            />
            <div style={{ padding:'12px', borderRadius:'var(--radius-md)', background:'rgba(167,139,250,0.04)', border:'1px solid rgba(167,139,250,0.1)', marginTop:16 }}>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>
                {privacy.allowMessagesFrom === 'everyone' && '✅ Anyone on VELA can message you directly.'}
                {privacy.allowMessagesFrom === 'followers' && '👤 Only people who follow you can message directly. Others must send a request first.'}
                {privacy.allowMessagesFrom === 'nobody' && '🔒 Nobody can message you. Existing conversations are unaffected.'}
              </p>
            </div>
            <div style={{ paddingTop: 20 }}>
              <motion.button onClick={handleSavePrivacy} disabled={savingPrivacy} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ padding:'12px', borderRadius:'var(--radius-md)', background:savingPrivacy?'var(--bg-glass)':'var(--grad-brand)', color:'white', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', width:'100%' }}>
                {savingPrivacy ? 'Saving...' : 'Save Message Settings'}
              </motion.button>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Notifications tab ── */}
      {tab === 'notifs' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <SectionCard title="Notification Settings" icon={HiBell}>
            <Toggle
              value={privacy.emailNotifications}
              onChange={v => updatePrivacy('emailNotifications', v)}
              label="Email Notifications"
              sublabel="Receive important updates via email"
            />
            <Toggle
              value={privacy.notificationSound}
              onChange={v => updatePrivacy('notificationSound', v)}
              label="Notification Sound"
              sublabel="Play a sound when you receive a notification"
            />
            <div style={{ paddingTop: 20 }}>
              <motion.button onClick={handleSavePrivacy} disabled={savingPrivacy} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ padding:'12px', borderRadius:'var(--radius-md)', background:savingPrivacy?'var(--bg-glass)':'var(--grad-brand)', color:'white', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', width:'100%' }}>
                {savingPrivacy ? 'Saving...' : 'Save Notification Settings 🔔'}
              </motion.button>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Security tab ── */}
      {tab === 'security' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <SectionCard title="Change Password" icon={HiLockClosed}>
            <form onSubmit={handlePasswordChange} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { key:'current', label:'Current Password' },
                { key:'newPass', label:'New Password' },
                { key:'confirm', label:'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwords[key]}
                      onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                      className="input-vela"
                      style={{ paddingRight:40 }}
                    />
                    <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key] }))}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
                      {showPasswords[key] ? <HiEyeOff size={16}/> : <HiEye size={16}/>}
                    </button>
                  </div>
                </div>
              ))}
              <motion.button type="submit" disabled={changingPass} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ padding:'12px', borderRadius:'var(--radius-md)', background:changingPass?'var(--bg-glass)':'var(--bg-elevated)', border:'1px solid var(--bg-glass-border)', color:'var(--text-primary)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, cursor:changingPass?'not-allowed':'pointer' }}>
                {changingPass?'Updating...':'Update Password'}
              </motion.button>
            </form>
          </SectionCard>
        </motion.div>
      )}
    </div>
  );
}
