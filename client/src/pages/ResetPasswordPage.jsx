import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLockClosed, HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi';
import api from '../utils/api.js';
import { VelaLogo } from '../components/common/LoadingScreen.jsx';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { newPassword });
      if (data.success) {
        setDone(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="noise-overlay" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 32px', backdropFilter: 'blur(20px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <VelaLogo size={40} />
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <HiCheckCircle size={56} style={{ color: '#34D399', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Set New Password</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'New Password', val: newPassword, set: setNewPassword },
                { label: 'Confirm Password', val: confirm, set: setConfirm },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <HiLockClosed style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type={showPw ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} placeholder="••••••••" className="input-vela" style={{ paddingLeft: 36, paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      {showPw ? <HiEyeOff size={16} /> : <HiEye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password strength */}
              {newPassword.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: newPassword.length >= n*2 ? (newPassword.length >= 8 ? '#34D399' : '#FBBF24') : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Fair' : newPassword.length < 12 ? 'Good' : 'Strong'}</span>
                </div>
              )}

              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: 13, borderRadius: 14, background: loading ? 'var(--bg-glass)' : 'var(--grad-brand)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Back to Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
