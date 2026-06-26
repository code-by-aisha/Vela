import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// ─── VelaLogo — exported so Sidebar, LandingPage, Auth pages can use it ────────
export function VelaLogo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vg1" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#A78BFA" stopOpacity="0.95" />
            <stop offset="55%"  stopColor="#5F506B" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#533747" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="vg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#A78BFA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#533747" stopOpacity="0"   />
          </radialGradient>
          <filter id="vblur"><feGaussianBlur stdDeviation="1.8" /></filter>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#vg2)" filter="url(#vblur)" />
        <circle cx="24" cy="24" r="20" fill="url(#vg1)" />
        <ellipse cx="18" cy="16" rx="5.5" ry="3.5" fill="white" opacity="0.13" transform="rotate(-22 18 16)" />
        <circle  cx="24" cy="24" r="20"   fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
        <path d="M16 16 L24 32 L32 16" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.97" />
        <path d="M18.5 16 L24 28 L29.5 16" fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.55,
          letterSpacing: '0.13em',
          background: 'linear-gradient(135deg, #A78BFA 0%, #86BBBD 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>VELA</span>
      )}
    </div>
  );
}

// ─── LoadingScreen (default export) ──────────────────────────────────────────
export default function LoadingScreen() {
  const [elapsed,  setElapsed]  = useState(0);
  const [serverOk, setServerOk] = useState(true);

  // Tick every second so we can show elapsed time + trigger server check
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Ping /api/health after 2.5s — detect if server is down
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
        setServerOk(r.ok);
      } catch {
        setServerOk(false);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, zIndex: 99999,
      fontFamily: 'var(--font-body)',
    }}>
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <VelaLogo size={60} />
      </motion.div>

      {/* Bouncing dots */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 7, alignItems: 'center' }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -9, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#A78BFA' }}
          />
        ))}
      </motion.div>

      {/* Status hint — shows after 3 seconds */}
      {elapsed >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', padding: '0 24px', maxWidth: 340 }}
        >
          {!serverOk ? (
            <div style={{
              padding: '16px 20px', borderRadius: 16,
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.22)',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', margin: '0 0 8px' }}>
                ⚠️ Server not running
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 12px' }}>
                Open a terminal and run:
              </p>
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, textAlign: 'left' }}>
                <code style={{ fontSize: 12, color: '#A78BFA' }}>cd server &amp;&amp; npm run dev</code>
              </div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 24px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #533747, #A78BFA)',
                  color: 'white', border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              Connecting… {elapsed}s
              {elapsed >= 6 && (
                <button
                  onClick={() => window.location.reload()}
                  style={{ marginLeft: 10, fontSize: 12, color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Retry
                </button>
              )}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
