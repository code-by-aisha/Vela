import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import api from '../utils/api.js';
import { VelaLogo } from '../components/common/LoadingScreen.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');
  const [devNote, setDevNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Please enter your email.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.success) {
        setSent(true);
        if (data.devResetUrl) setDevUrl(data.devResetUrl);
        if (data.devNote)     setDevNote(data.devNote);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="noise-overlay" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 32px', backdropFilter: 'blur(20px)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <VelaLogo size={40} />
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Forgot Password?</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>Enter your email and we'll send you a link to reset your password.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <HiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input-vela" style={{ paddingLeft: 36 }} autoFocus />
              </div>
              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '13px', borderRadius: 14, background: loading ? 'var(--bg-glass)' : 'var(--grad-brand)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(167,139,250,0.3)' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              If an account with <strong>{email}</strong> exists, you'll receive a password reset link shortly.
            </p>
            {devNote && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 12, textAlign: 'left' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚠ Email Not Configured</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>Set SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env to enable real emails. Use the dev link below for now.</p>
              </div>
            )}
            {devUrl && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 20, textAlign: 'left' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔧 Dev Mode — Click to Reset</p>
                <Link to={devUrl.replace(window.location.origin, '')} style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all', textDecoration: 'underline' }}>{devUrl}</Link>
              </div>
            )}
            {!devUrl && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Didn't receive it? Check your spam folder.</p>}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 14, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <HiArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
