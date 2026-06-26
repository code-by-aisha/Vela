import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiSparkles, HiMenu, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { VelaLogo } from '../components/common/LoadingScreen.jsx';

// ─── VELA brand palette (no greens, no reds) ──────────────────────────────────
const BRAND = {
  mauveShad:    '#533747',
  vintageGrape: '#5F506B',
  blueSlate:    '#6A6B83',
  coolSteel:    '#76949F',
  pearlAqua:    '#86BBBD',
  accent:       '#A78BFA',
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🌀', title: 'Aura System',    desc: 'Your unique creative identity that evolves with engagement — from Rising Star to Visionary Aura.' },
  { icon: '🎵', title: 'Music Moments',  desc: 'Attach a soundtrack to every moment. Share not just what you see, but what you feel.' },
  { icon: '✨', title: 'Vibe Score',     desc: 'A dynamic score reflecting your presence, creativity, and connections on VELA.' },
  { icon: '🔥', title: '10 Reactions',   desc: 'Go beyond likes. Express with Beautiful, Fire, Mind Blown, Aesthetic, and more.' },
  { icon: '💬', title: 'Real-Time Chat', desc: 'One-to-one messages with typing indicators, seen receipts, and online presence.' },
  { icon: '🎭', title: 'Mood Posts',     desc: 'Tag Moments with moods: Aesthetic, Calm, Energetic, Creative, Personal, and more.' },
];

const STATS = [
  { value: '10', suffix: '+', label: 'Reaction Types' },
  { value: '5',  suffix: '',  label: 'Aura Levels'    },
  { value: '20', suffix: '+', label: 'Music Tracks'   },
  { value: '99', suffix: '%', label: 'Vibe Match'     },
];

const AURA_LEVELS = [
  {
    level: 'Rising Star',
    score: 15, emoji: '⭐',
    desc: 'Your journey begins. Share moments and interact to unlock new aura frequencies.',
    color: BRAND.coolSteel,
    grad:  `linear-gradient(135deg, ${BRAND.coolSteel}, ${BRAND.blueSlate})`,
    glow:  'rgba(118,148,159,0.45)',
  },
  {
    level: 'Explorer Aura',
    score: 38, emoji: '🔍',
    desc: 'Stepping into the vibe. You attach music and explore creators. Your presence solidifies.',
    color: BRAND.vintageGrape,
    grad:  `linear-gradient(135deg, ${BRAND.vintageGrape}, ${BRAND.mauveShad})`,
    glow:  'rgba(95,80,107,0.45)',
  },
  {
    level: 'Storyteller Aura',
    score: 55, emoji: '📖',
    desc: 'Crafting the narrative. Daily moments and connections shape your unique frequency.',
    color: BRAND.blueSlate,
    grad:  `linear-gradient(135deg, ${BRAND.blueSlate}, ${BRAND.mauveShad})`,
    glow:  'rgba(106,107,131,0.5)',
  },
  {
    level: 'Creative Aura',
    score: 78, emoji: '🎨',
    desc: 'An artistic pioneer. Your vibe matches align and your soundscapes inspire followers.',
    color: BRAND.pearlAqua,
    grad:  `linear-gradient(135deg, ${BRAND.pearlAqua}, ${BRAND.blueSlate})`,
    glow:  'rgba(134,187,189,0.45)',
  },
  {
    level: 'Visionary Aura',
    score: 98, emoji: '🌀',
    desc: 'Ultimate creative clarity. You shape trends and radiate pure aesthetic depth.',
    color: BRAND.accent,
    grad:  `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.vintageGrape})`,
    glow:  'rgba(167,139,250,0.55)',
  },
];

const TESTIMONIALS = [
  { id:0,  text:"VELA feels like the platform I've been waiting for. The Aura system actually makes me want to create more.", by:"Zara K., Visionary Aura",   img:"https://i.pravatar.cc/150?img=1"  },
  { id:1,  text:"Attaching music to my moments changed everything. It's not just a photo app anymore.",                       by:"Malik R., Creative Aura",   img:"https://i.pravatar.cc/150?img=2"  },
  { id:2,  text:"The glassmorphism design is stunning. Every interaction feels premium and intentional.",                     by:"Nova S., Trendsetter Aura", img:"https://i.pravatar.cc/150?img=3"  },
  { id:3,  text:"I love how my vibe score actually reflects how engaged I am. Feels like a game.",                            by:"Aryan M., Storyteller",     img:"https://i.pravatar.cc/150?img=4"  },
  { id:4,  text:"The music library has Pasoori and AP Dhillon. Instantly became my favourite app.",                           by:"Hira F., Explorer Aura",    img:"https://i.pravatar.cc/150?img=5"  },
  { id:5,  text:"Real-time chat with typing indicators is so smooth. Instagram DMs feel outdated now.",                      by:"Ali B., Creative Aura",     img:"https://i.pravatar.cc/150?img=6"  },
  { id:6,  text:"Stories with background music playing while I view them — finally someone did it right.",                   by:"Sana T., Visionary Aura",   img:"https://i.pravatar.cc/150?img=7"  },
  { id:7,  text:"The Explore page feels like Reels but way more curated. I love the snap scroll.",                           by:"Omar K., Rising Star",      img:"https://i.pravatar.cc/150?img=8"  },
  { id:8,  text:"10 different reactions instead of just a like. My posts feel truly appreciated.",                           by:"Farah N., Storyteller",     img:"https://i.pravatar.cc/150?img=9"  },
  { id:9,  text:"Mood tagging is genius. I can find all my Aesthetic posts in one place.",                                   by:"Isha P., Creative Aura",    img:"https://i.pravatar.cc/150?img=10" },
  { id:10, text:"I switched from Instagram a month ago. Haven't looked back once.",                                          by:"Dev S., Visionary Aura",    img:"https://i.pravatar.cc/150?img=11" },
  { id:11, text:"The message request system actually protects my inbox. Love the privacy controls.",                         by:"Noor A., Explorer Aura",    img:"https://i.pravatar.cc/150?img=12" },
  { id:12, text:"Sheesha and Majboor in the music library. VELA clearly knows its audience.",                                by:"Bilal H., Creative Aura",   img:"https://i.pravatar.cc/150?img=13" },
  { id:13, text:"The landing page alone made me sign up. Most beautiful social app I've seen.",                              by:"Mia L., Trendsetter Aura",  img:"https://i.pravatar.cc/150?img=14" },
  { id:14, text:"Collections feature is underrated. I save every aesthetic post now.",                                       by:"Riya D., Storyteller",      img:"https://i.pravatar.cc/150?img=15" },
  { id:15, text:"Pasoori starts playing when I open someone's story. Absolute cinema.",                                      by:"Zain M., Visionary Aura",   img:"https://i.pravatar.cc/150?img=16" },
  { id:16, text:"My aura went from Rising Star to Explorer in one week. So motivating.",                                     by:"Hana K., Explorer Aura",    img:"https://i.pravatar.cc/150?img=17" },
  { id:17, text:"I've found creators I actually vibe with. The algorithm just gets it.",                                     by:"Tara B., Creative Aura",    img:"https://i.pravatar.cc/150?img=18" },
  { id:18, text:"The whole platform is dark, glassmorphic and gorgeous. Peak aesthetic.",                                    by:"Leo J., Trendsetter Aura",  img:"https://i.pravatar.cc/150?img=19" },
  { id:19, text:"Got a message request notification instantly. Real-time actually means real-time.",                          by:"Sara M., Rising Star",      img:"https://i.pravatar.cc/150?img=20" },
];

// ─── Responsive breakpoint hook ───────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w < 480)  return 'xs';
    if (w < 768)  return 'sm';
    if (w < 1024) return 'md';
    return 'lg';
  });
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 480)       setBp('xs');
      else if (w < 768)  setBp('sm');
      else if (w < 1024) setBp('md');
      else               setBp('lg');
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}

// ─── FloatingPill — premium VELA glassmorphic shape ───────────────────────────
function FloatingPill({
  delay = 0,
  width = 600,
  height = 140,
  rotate = 0,
  color = '#6366f1',
  floatY = 15,
  floatDuration = 12,
  parallaxStrength = 6,
  scale = 1,
  style = {},
  opacity = 1,
  blurAmount = 6,          // balanced blur
  glowIntensity = 0.9,     // mild glow
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useTransform(mx, [-1, 1], [-parallaxStrength * scale, parallaxStrength * scale]);
  const py = useTransform(my, [-1, 1], [-parallaxStrength * scale * 0.5, parallaxStrength * scale * 0.5]);

  useEffect(() => {
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth  - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);

  const hex2rgba = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const c = (a) => hex2rgba(color, a);

  const w = width  * scale;
  const h = height * scale;
  const fY = floatY * scale;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -60, rotate: rotate - 12 }}
      animate={{ opacity: opacity, scale: 1, y: 0, rotate }}
      transition={{
        duration: 2.6,
        delay,
        ease: [0.16, 0.84, 0.44, 1],
        opacity: { duration: 1.4, delay: delay + 0.2 },
        scale: { duration: 1.8, delay: delay + 0.1 },
      }}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 3,
        x: px,
        y: py,
        willChange: 'transform',
        ...style,
      }}
    >
      <motion.div
        animate={{ y: [0, fY, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: w, height: h, position: 'relative' }}
      >
        {/* Outer glow – softer */}
        <div style={{
          position: 'absolute',
          inset: -12 * scale,
          borderRadius: 9999,
          background: `radial-gradient(ellipse 70% 100% at 40% 50%, ${c(0.15 * glowIntensity)}, transparent 65%)`,
          filter: `blur(${22 * scale}px)`,
        }} />

        {/* Main pill – glass with subtle transparency */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: `linear-gradient(145deg, ${c(0.12)}, ${c(0.02)})`,
          backdropFilter: `blur(${blurAmount * scale}px)`,
          WebkitBackdropFilter: `blur(${blurAmount * scale}px)`,
          border: `${Math.max(1, 1.4 * scale)}px solid ${c(0.3)}`,
          boxShadow: `
            0 ${8 * scale}px ${30 * scale}px ${c(0.08)},
            inset 0 1.5px 0 ${c(0.4)},
            inset 0 -1.5px 0 ${c(0.05)}
          `,
        }} />

        {/* Top gloss – subtle */}
        <div style={{
          position: 'absolute',
          top: '10%', left: '5%',
          width: '40%', height: '16%',
          borderRadius: 9999,
          background: `linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.02) 70%, transparent)`,
          filter: `blur(${2.5 * scale}px)`,
        }} />

        {/* Bottom reflection – very faint */}
        <div style={{
          position: 'absolute',
          bottom: '14%', right: '8%',
          width: '30%', height: '10%',
          borderRadius: 9999,
          background: `linear-gradient(270deg, rgba(255,255,255,0.06), transparent)`,
          filter: `blur(${2 * scale}px)`,
        }} />

        {/* Inner colour shimmer – soft */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: `radial-gradient(ellipse 50% 60% at 30% 40%, ${c(0.12)}, transparent 60%)`,
        }} />

        {/* Edge highlight – gentle */}
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 9999,
          background: `linear-gradient(135deg, ${c(0.25)}, transparent 40%, ${c(0.06)})`,
          opacity: 0.4,
          pointerEvents: 'none',
        }} />
      </motion.div>
    </motion.div>
  );
}
// ─── Animated stat counter ─────────────────────────────────────────────────────
function StatCounter({ value, suffix, label }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count  = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) return animate(count, parseInt(value) || 0, { duration: 1.4, ease: 'easeOut' }).stop;
  }, [inView]);
  useEffect(() => rounded.on('change', v => setDisplay(v.toString())), [rounded]);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5.5vw,60px)',
        fontWeight: 800, lineHeight: 1,
        background: `linear-gradient(135deg, white 30%, ${BRAND.pearlAqua})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        display: 'inline-flex', alignItems: 'baseline', gap: 2,
      }}>
        <span>{display}</span>
        <span style={{ fontSize: '0.55em', color: BRAND.accent, marginLeft: 1 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Magnetic CTA button ───────────────────────────────────────────────────────
function MagneticButton({ children, to }) {
  const ref = useRef(null);
  const x   = useSpring(0, { stiffness: 200, damping: 18 });
  const y   = useSpring(0, { stiffness: 200, damping: 18 });

  const onMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = e.clientX - (left + width / 2);
    const dy = e.clientY - (top  + height / 2);
    if (Math.hypot(dx, dy) < 80) { x.set(dx * 0.28); y.set(dy * 0.28); }
    else { x.set(0); y.set(0); }
  };

  return (
    <Link to={to} style={{ display: 'inline-block' }}>
      <motion.div ref={ref} style={{ x, y }} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
        {children}
      </motion.div>
    </Link>
  );
}

// ─── Testimonial card ──────────────────────────────────────────────────────────
function TestimonialCard({ position, testimonial, handleMove, cardSize }) {
  const isCenter = position === 0;
  return (
    <div
      onClick={() => handleMove(position)}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        width: cardSize, height: cardSize,
        cursor: 'pointer',
        clipPath: `polygon(36px 0%,calc(100% - 36px) 0%,100% 36px,100% 100%,calc(100% - 36px) 100%,36px 100%,0 100%,0 0)`,
        background: isCenter
          ? `linear-gradient(135deg, ${BRAND.mauveShad}, ${BRAND.accent})`
          : 'rgba(15,13,18,0.85)',
        border: isCenter ? 'none' : '1.5px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        padding: 28,
        boxSizing: 'border-box',
        transition: 'all 0.45s cubic-bezier(0.23,0.86,0.39,0.96)',
        boxShadow: isCenter
          ? `0 8px 0 4px rgba(167,139,250,0.25), 0 20px 50px rgba(0,0,0,0.5)`
          : '0 0 0 0 transparent',
        transform: `translate(-50%,-50%) translateX(${(cardSize / 1.5) * position}px) translateY(${isCenter ? -60 : position % 2 ? 12 : -12}px) rotate(${isCenter ? 0 : position % 2 ? 2 : -2}deg)`,
        zIndex: isCenter ? 10 : 0,
      }}
    >
      <div style={{ position: 'absolute', right: -1, top: 34, width: Math.sqrt(36*36+36*36), height: 1.5, background: 'rgba(255,255,255,0.12)', transform: 'rotate(45deg)', transformOrigin: 'top right' }} />
      <img src={testimonial.img} alt="" style={{ width: 48, height: 42, objectFit: 'cover', objectPosition: 'top', marginBottom: 14, display: 'block', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)' }} />
      <h3 style={{ fontSize: 'clamp(11px,1.3vw,14px)', fontWeight: 600, color: isCenter ? 'white' : 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 0 }}>
        "{testimonial.text}"
      </h3>
      <p style={{ position: 'absolute', bottom: 20, left: 22, right: 22, fontSize: 10, fontStyle: 'italic', color: isCenter ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', margin: 0 }}>
        — {testimonial.by}
      </p>
    </div>
  );
}

function StaggerTestimonials() {
  const [cardSize, setCardSize] = useState(320);
  const [list, setList]         = useState(TESTIMONIALS);

  const move = (steps) => {
    const nl = [...list];
    if (steps > 0) { for (let i = steps; i > 0; i--) { const it = nl.shift(); if (it) nl.push({ ...it, id: Math.random() }); } }
    else           { for (let i = steps; i < 0; i++) { const it = nl.pop();   if (it) nl.unshift({ ...it, id: Math.random() }); } }
    setList(nl);
  };

  useEffect(() => {
    const upd = () => setCardSize(window.matchMedia('(min-width:640px)').matches ? 320 : 260);
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', height: 520 }}>
      {list.map((t, idx) => {
        const pos = list.length % 2 ? idx - (list.length + 1) / 2 : idx - list.length / 2;
        return <TestimonialCard key={t.id} testimonial={t} handleMove={move} position={pos} cardSize={cardSize} />;
      })}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 20 }}>
        {[{ dir: -1, icon: <HiChevronLeft size={20} /> }, { dir: 1, icon: <HiChevronRight size={20} /> }].map(({ dir, icon }) => (
          <button key={dir} onClick={() => move(dir)}
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,13,18,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.09)', color: 'white', cursor: 'pointer', borderRadius: 0, clipPath: 'polygon(7px 0%,100% 0%,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${BRAND.mauveShad},${BRAND.accent})`; e.currentTarget.style.borderColor = 'transparent'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,13,18,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
          >{icon}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Premium Aura Card ─────────────────────────────────────────────────────────
function AuraCard({ aura, isSelected, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: isSelected ? 0 : -8, transition: { duration: 0.25 } }}
      style={{
        position: 'relative', cursor: 'pointer',
        padding: isSelected ? 28 : 24,
        borderRadius: 20,
        background: isSelected
          ? aura.grad
          : hovered
            ? `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`
            : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.18)' : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(20px)',
        boxShadow: isSelected
          ? `0 24px 60px ${aura.glow}, 0 0 0 1px ${aura.color}30, inset 0 1px 0 rgba(255,255,255,0.15)`
          : hovered
            ? `0 8px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`
            : 'none',
        transition: 'all 0.3s cubic-bezier(0.25,0.4,0.25,1)',
        minHeight: 210,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', right: -1, top: 20,
        width: 33, height: 1.5,
        background: isSelected ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)',
        transform: 'rotate(45deg)', transformOrigin: 'right top',
        transition: 'background 0.3s',
      }} />

      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)`,
        }} />
      )}

      <div>
        <motion.div
          animate={isSelected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
          style={{
            width: 50, height: 50, borderRadius: '50%',
            background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, marginBottom: 16,
            boxShadow: isSelected ? `0 0 18px ${aura.glow}` : hovered ? `0 0 10px ${aura.glow}50` : 'none',
            transition: 'all 0.3s',
          }}
        >
          {aura.emoji}
        </motion.div>

        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
          color: isSelected ? 'white' : active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          marginBottom: 8, lineHeight: 1.2, transition: 'color 0.25s',
        }}>
          {aura.level}
        </h3>
        <p style={{
          fontSize: 12, lineHeight: 1.65, margin: 0,
          color: isSelected ? 'rgba(255,255,255,0.8)' : active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.28)',
          transition: 'color 0.25s',
        }}>
          {aura.desc}
        </p>
      </div>

      <div style={{
        marginTop: 16,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 11px',
        background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
        borderRadius: 100,
        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : `${aura.color}30`}`,
        alignSelf: 'flex-start',
        transition: 'all 0.3s',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: isSelected ? 'white' : aura.color,
          boxShadow: isSelected ? 'none' : `0 0 6px ${aura.color}`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? 'white' : aura.color, letterSpacing: '0.06em' }}>
          SCORE {aura.score}+
        </span>
      </div>
    </motion.div>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, delay: index * 0.055, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{
        padding: 28, borderRadius: 20,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        cursor: 'default',
        position: 'relative', overflow: 'hidden',
      }}
      onHoverStart={e => { e.target.style && (e.target.style.borderColor = 'rgba(167,139,250,0.2)'); }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${BRAND.accent}40, transparent)`, opacity: 0 }} className="feature-shimmer" />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 18 }}>
        {feature.icon}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 9 }}>{feature.title}</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>{feature.desc}</p>
    </motion.div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAura,   setSelectedAura]   = useState(4);
  const [scrolled,       setScrolled]       = useState(false);
  const bp = useBreakpoint();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

   // Pill configuration — 5 pills positioned around the heading
    // Pill configuration — 5 pills positioned exactly like the reference
   // Pill configuration — exactly matches the reference layout (5 shapes)
   // Pill configuration — with adjustments for better proximity and sizing
 
    // Pill configuration — based on the reference layout, with fine‑tuned adjustments
  const getPillConfig = () => {
    const isXs = bp === 'xs';
    const isSm = bp === 'sm';
    const isMd = bp === 'md';
    const isLg = bp === 'lg';

    // Scale factor to keep proportions on smaller screens
    let scale = 1;
    if (isXs) scale = 0.50;
    else if (isSm) scale = 0.65;
    else if (isMd) scale = 0.80;
    else scale = 1.35;

    // Shapes exactly as in the reference, with responsive position overrides
    const shapes = [
      // Shape 1: Top-left large (indigo)
      {
        id: 'tl-large',
        width: 600,
        height: 140,
        rotate: 12,
        color: '#6366f1',
        style: {
          left: isXs ? '-25%' : isSm ? '-10%' : isMd ? '-8%' : '-5%',   // less negative on mobile = closer
          top: isXs ? '30%' : isSm ? '25%' : isMd ? '18%' : '25%',
        }
      },
      // Shape 2: Bottom-right large (violet)
      {
        id: 'br-large',
        width: 500,
        height: 120,
        rotate: -15,
        color: '#8b5cf6',
        style: {
          right: isXs ? '-30%' : isSm ? '-4%' : isMd ? '-6%' : '-5%',   // less negative on mobile
          top: isXs ? '50%' : isSm ? '68%' : isMd ? '72%' : '55%',      // raised slightly on mobile
        }
      },
      // Shape 3: Bottom-left medium (accent)
      {
        id: 'bl-med',
        width: 300,
        height: 80,
        rotate: -8,
        color: '#a78bfa',
        style: {
          left: isXs ? '-15%' : isSm ? '4%' : isMd ? '8%' : '5%',
          bottom: isXs ? '35%' : isSm ? '8%' : isMd ? '10%' : '10%',
        }
      },
      // Shape 4: Top-right medium (coolSteel)
      {
        id: 'tr-med',
        width: 200,
        height: 60,
        rotate: 20,
        color: '#76949F',
        style: {
          right: isXs ? '1%' : isSm ? '12%' : isMd ? '16%' : '15%',
          top: isXs ? '20%' : isSm ? '12%' : isMd ? '18%' : '15%',    // lowered on tablet
        }
      },
      // Shape 5: Small above top-left (pearlAqua) – increased size
      {
        id: 'small-above-tl',
        width: 210,   // was 150
        height: 60,   // was 40
        rotate: -5,
        color: '#86BBBD',
        style: {
          left: isXs ? '5%' : isSm ? '14%' : isMd ? '18%' : '10%',
          top: isXs ? '24%' : isSm ? '6%' : isMd ? '12%' : '10%',       // lowered on tablet
        }
      }
    ];

    return shapes.map(shape => ({
      ...shape,
      scale: scale,
      floatY: shape.id === 'small-above-tl' ? 4 : 8,
      floatDuration: shape.id === 'small-above-tl' ? 12 : 14,
      parallaxStrength: shape.id === 'small-above-tl' ? 2 : 5,
    }));
  };
  const pills = getPillConfig();

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'var(--font-body)' }}>
      <div className="noise-overlay" />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: scrolled ? '13px clamp(16px,5vw,60px)' : '20px clamp(16px,5vw,60px)',
          background: scrolled ? 'rgba(10,10,15,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(22px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <VelaLogo size={34} />
        <div style={{ display: 'flex', gap: 34, alignItems: 'center' }} className="d-none d-md-flex">
          {['Features', 'Aura System', 'Creators'].map(lnk => (
            <a key={lnk} href={`#${lnk.toLowerCase().replace(' ', '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >{lnk}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" className="d-none d-sm-inline-flex"
            style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.16)'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = 'rgba(255,255,255,0.55)'; }}
          >Sign In</Link>
          <Link to="/register" style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--grad-brand)', color: 'white', textDecoration: 'none', boxShadow: '0 0 18px rgba(167,139,250,0.22)', fontFamily: 'var(--font-display)' }}>
            Get Started
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="d-md-none"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'white', cursor: 'pointer' }}>
            {mobileMenuOpen ? <HiX size={17} /> : <HiMenu size={17} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            style={{ position: 'fixed', top: 68, left: 12, right: 12, borderRadius: 18, background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.09)', zIndex: 999, padding: '20px 24px', boxShadow: '0 20px 50px rgba(0,0,0,0.55)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Features', 'Aura System', 'Creators'].map(lnk => (
                <a key={lnk} href={`#${lnk.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'white', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
                  {lnk}
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: 11, borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'white', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ padding: 11, borderRadius: 10, textAlign: 'center', background: 'var(--grad-brand)', color: 'white', fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="vela-hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {(() => {
        const heroPad = bp === 'xs' ? '100px 20px 80px'
                      : bp === 'sm' ? '110px 28px 88px'
                      : bp === 'md' ? '120px 40px 90px'
                      : '140px 24px 100px';
        return (<>

        {/* ─── HERO BACKGROUND — premium ambient layers ─── */}

        {/* Deep base gradient */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 70% at 50% 45%, #1a1420 0%, #0a0a0f 70%)',
        }} />

        {/* Soft ambient glow - centered behind heading */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '70%', height: '60%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${BRAND.mauveShad}20 0%, ${BRAND.accent}10 30%, transparent 65%)`,
          filter: 'blur(50px)',
        }} />

        {/* Warm inner glow - slightly offset */}
        <div style={{
          position: 'absolute',
          left: '40%', top: '35%',
          transform: 'translate(-50%, -50%)',
          width: '50%', height: '40%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${BRAND.pearlAqua}15 0%, transparent 60%)`,
          filter: 'blur(60px)',
        }} />

        {/* Cool secondary glow */}
        <div style={{
          position: 'absolute',
          right: '30%', bottom: '30%',
          transform: 'translate(50%, 50%)',
          width: '40%', height: '35%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${BRAND.blueSlate}12 0%, transparent 60%)`,
          filter: 'blur(55px)',
        }} />

        {/* Top-left light beam */}
        <div style={{
          position: 'absolute',
          left: '-10%', top: '-10%',
          width: '50%', height: '50%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 80% at 30% 20%, ${BRAND.accent}08 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }} />

        {/* Bottom-right light beam */}
        <div style={{
          position: 'absolute',
          right: '-10%', bottom: '-10%',
          width: '45%', height: '45%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 80% at 70% 80%, ${BRAND.pearlAqua}06 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }} />

        {/* Top-right subtle accent */}
        <div style={{
          position: 'absolute',
          right: '5%', top: '10%',
          width: '30%', height: '25%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${BRAND.vintageGrape}08 0%, transparent 60%)`,
          filter: 'blur(50px)',
        }} />

        {/* Bottom-left subtle accent */}
        <div style={{
          position: 'absolute',
          left: '5%', bottom: '15%',
          width: '25%', height: '20%',
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${BRAND.blueSlate}08 0%, transparent 60%)`,
          filter: 'blur(45px)',
        }} />

        {/* ═══════════════════════════════════════════════════════════════════
            HERO PILLS — exactly 5 pills as described
        ═══════════════════════════════════════════════════════════════════ */}

        {pills.map((pill, index) => (
          <FloatingPill
            key={pill.id}
            delay={0.3 + index * 0.08}
            width={pill.width}
            height={pill.height}
            rotate={pill.rotate}
            color={pill.color}
            floatY={pill.floatY}
            floatDuration={pill.floatDuration}
            parallaxStrength={pill.parallaxStrength}
            scale={pill.scale}
            style={pill.style}
            opacity={1}
            blurAmount={4}
            glowIntensity={1}
          />
        ))}

        {/* Edge fade */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to bottom, #0a0a0f 0%, transparent 12%, transparent 82%, #0a0a0f 100%)' }} />

        {/* ── HERO TEXT ── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: heroPad, maxWidth: 800, width: '100%', margin: '0 auto' }}>

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.04em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND.accent, display: 'inline-block', boxShadow: `0 0 7px ${BRAND.accent}`, flexShrink: 0 }} />
              Share Your Vibe
            </div>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
            style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(42px, 10vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              marginBottom: 28,
            }}
          >
            <span style={{ display: 'block', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
              Share Your
            </span>
            <span style={{
              display: 'block',
              background: `linear-gradient(95deg, ${BRAND.mauveShad} 0%, #C4A3E8 28%, ${BRAND.accent} 55%, ${BRAND.pearlAqua} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Vibe
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.58, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ fontSize: 'clamp(13px, 1.8vw, 17px)', color: 'rgba(255,255,255,0.35)', lineHeight: 1.75, maxWidth: 490, margin: '0 auto 40px', fontWeight: 300, letterSpacing: '0.01em' }}
          >
            A social platform where moments, music, stories, and meaningful connections come together through innovative design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.68, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <MagneticButton to="/register">
              <div style={{ padding: '14px 38px', borderRadius: 13, background: 'var(--grad-brand)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 28px rgba(167,139,250,0.3)', cursor: 'pointer' }}>
                Get Started <HiArrowRight />
              </div>
            </MagneticButton>
            <MagneticButton to="/explore">
              <div style={{ padding: '14px 30px', borderRadius: 13, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                Explore Moments
              </div>
            </MagneticButton>
          </motion.div>
        </div>
        </>);
      })()}
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px clamp(16px,5vw,48px)', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(10,10,15,0.8)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 36 }}>
          {STATS.map((s, i) => <StatCounter key={i} value={s.value} suffix={s.suffix} label={s.label} />)}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '110px clamp(16px,5vw,48px) 90px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div style={{ fontSize: 11, color: BRAND.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Engineered for Expression</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.025em', color: 'white', marginBottom: 14 }}>Why VELA?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>Built for creators, storytellers, and vibe-seekers who demand a more premium, immersive social space.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 18 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── AURA SYSTEM ───────────────────────────────────────────────── */}
      <section id="aura-system" style={{ padding: '110px clamp(16px,5vw,48px)', background: 'rgba(10,10,15,0.5)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{ fontSize: 11, color: BRAND.pearlAqua, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Interactive Identity</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.025em', color: 'white', marginBottom: 14 }}>
              Discover Your{' '}
              <span style={{ background: `linear-gradient(95deg, ${BRAND.accent}, ${BRAND.pearlAqua})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Aura</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', maxWidth: 440, margin: '0 auto' }}>A living representation of your presence, expression, and music taste. Click a card to explore.</p>
          </motion.div>

          <div style={{ position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAura}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, borderRadius: 24, background: `radial-gradient(ellipse 55% 70% at ${(selectedAura / 4) * 100}% 50%, ${AURA_LEVELS[selectedAura].glow} 0%, transparent 65%)`, filter: 'blur(30px)' }}
              />
            </AnimatePresence>

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(188px,1fr))', gap: 14 }}>
              {AURA_LEVELS.map((aura, i) => (
                <AuraCard key={aura.level} aura={aura} isSelected={selectedAura === i} onClick={() => setSelectedAura(i)} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section id="creators" style={{ padding: '110px clamp(16px,5vw,48px) 90px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{ fontSize: 11, color: BRAND.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Real Creators</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>What the Community Says</h2>
          </motion.div>
          <StaggerTestimonials />
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '120px clamp(16px,5vw,48px)', position: 'relative', overflow: 'hidden', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, height: 480, background: `radial-gradient(circle, ${BRAND.accent}12 0%, transparent 65%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 620, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1.06, marginBottom: 18 }}>
              Ready to share<br />
              <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your vibe?</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px' }}>
              Join VELA and start connecting beyond standard feeds.
            </p>
            <MagneticButton to="/register">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '15px 42px', borderRadius: 16, background: 'var(--grad-brand)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, boxShadow: '0 10px 36px rgba(167,139,250,0.32)', cursor: 'pointer' }}>
                <HiSparkles /> Join VELA for Free
              </div>
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '44px clamp(16px,5vw,48px) 32px', background: 'rgba(6,6,10,0.9)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
          <VelaLogo size={28} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', margin: 0 }}>© {new Date().getFullYear()} VELA · Share Your Vibe · Designed with ✨</p>
          <div style={{ display: 'flex', gap: 22 }}>
            {['Privacy', 'Terms', 'Contact'].map(lnk => (
              <span key={lnk} style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.22)'}
              >{lnk}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}