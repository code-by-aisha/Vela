import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiArrowLeft, HiClipboardCopy, HiCheckCircle } from 'react-icons/hi';
import api from '../utils/api.js';
import { VelaLogo } from '../components/common/LoadingScreen.jsx';

export default function ForgotPasswordPage() {
  const [email,    setEmail]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [sent,     setSent]    = useState(false);
  const [devUrl,   setDevUrl]  = useState('');
  const [devNote,  setDevNote] = useState('');
  const [error,    setError]   = useState('');
  const [copied,   setCopied]  = useState(false);

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
        // In production, server may return resetUrl for admin use (when email not configured)
        if (data.resetUrl)    setDevUrl(data.resetUrl);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(devUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Extract the path from the full URL to use with React Router's Link
  const resetPath = devUrl ? devUrl.replace(window.location.origin, '') : '';

  return (
    <div style={{
      minHeight: '100vh', background: '#0F0D12',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="noise-overlay" />
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: '40px 32px',
          backdropFilter: 'blur(20px)', position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <VelaLogo size={40} />
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              Forgot Password?
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email and we'll generate a reset link for you.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <HiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-vela" style={{ paddingLeft: 36 }} autoFocus
                />
              </div>
              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: '13px', borderRadius: 14,
                  background: loading ? 'var(--bg-glass)' : 'var(--grad-brand)',
                  color: 'white', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 15, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(167,139,250,0.3)',
                }}
              >
                {loading ? 'Generating link...' : 'Get Reset Link'}
              </motion.button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{devUrl ? '🔑' : '📧'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
              {devUrl ? 'Your Reset Link' : 'Check your email'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {devUrl
                ? 'Click the button below to reset your password. This link expires in 1 hour.'
                : `If an account with ${email} exists, a reset link has been sent.`
              }
            </p>

            {/* Reset link box — shown when email not configured OR in dev mode */}
            {devUrl && (
              <div style={{ marginBottom: 20 }}>
                {devNote && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                    background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)',
                    textAlign: 'left',
                  }}>
                    <p style={{ fontSize: 12, color: '#FB923C', margin: 0, lineHeight: 1.5 }}>
                      ⚠️ Email not configured — use the link below directly.
                    </p>
                  </div>
                )}

                {/* Big CTA button to reset password */}
                <Link
                  to={resetPath}
                  style={{
                    display: 'block', padding: '14px 20px', borderRadius: 14,
                    background: 'var(--grad-brand)', color: 'white',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', marginBottom: 12,
                    boxShadow: '0 0 20px rgba(167,139,250,0.3)',
                  }}
                >
                  Reset My Password ✨
                </Link>

                {/* Copy link option */}
                <button
                  onClick={copyLink}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, width: '100%', padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {copied
                    ? <><HiCheckCircle size={16} color="#34D399" /> Copied!</>
                    : <><HiClipboardCopy size={16} /> Copy link</>
                  }
                </button>

                {/* Show the raw URL in a box for reference */}
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
                  textAlign: 'left',
                }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Link (expires in 1 hour)</p>
                  <p style={{ fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all', margin: 0, lineHeight: 1.5 }}>{devUrl}</p>
                </div>
              </div>
            )}

            {!devUrl && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setDevUrl(''); setDevNote(''); }}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline' }}
                >
                  try again
                </button>.
              </p>
            )}
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
