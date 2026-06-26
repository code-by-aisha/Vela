import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiRefresh, HiSparkles } from 'react-icons/hi';
import api from '../utils/api.js';
import MomentCard from '../components/feed/MomentCard.jsx';
import RightSidebar from '../components/layout/RightSidebar.jsx';
import StoriesBar from '../components/stories/StoriesBar.jsx';
import CreateMomentModal from '../components/feed/CreateMomentModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ padding: '0 20px 16px' }}>
        <div className="skeleton" style={{ width: '90%', height: 14, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 300 }} />
    </div>
  );
}

export default function FeedPage() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [quickText, setQuickText] = useState('');
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const { user } = useAuth();

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get(`/moments/feed?page=${pageNum}&limit=10`);
      if (data.success) {
        if (append) {
          setMoments(prev => [...prev, ...data.moments]);
        } else {
          setMoments(data.moments);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      if (pageNum === 1) toast.error('Could not load Moments Feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchFeed(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, fetchFeed]);

  const handleDelete = (id) => setMoments(prev => prev.filter(m => m._id !== id));
  const handleCreated = (moment) => setMoments(prev => [moment, ...prev]);

  // Listen for moments created from Sidebar / MobileNav modals
  useEffect(() => {
    const handler = (e) => handleCreated(e.detail);
    window.addEventListener('vela:moment-created', handler);
    return () => window.removeEventListener('vela:moment-created', handler);
  }, []);

  return (
    <div className="feed-layout">
      {/* Center column */}
      <div>
        {/* Stories */}
        <StoriesBar />

        {/* Quick post — typable input that opens CreateMomentModal */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex', gap: '12px', alignItems: 'center',
          }}
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} onClick={() => setShowCreate(true)} />
          ) : (
            <div onClick={() => setShowCreate(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <input
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            onFocus={() => { setShowCreate(true); }}
            placeholder="Share your vibe..."
            readOnly
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
              color: 'var(--text-muted)', fontSize: '14px',
              cursor: 'text', fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
        </motion.div>

        {showCreate && (
          <CreateMomentModal
            initialCaption={quickText}
            onClose={() => { setShowCreate(false); setQuickText(''); }}
            onCreated={(moment) => {
              setShowCreate(false);
              setQuickText('');
              handleCreated(moment);
            }}
          />
        )}

        {/* Feed header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiSparkles style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>Moments Feed</span>
          </div>
          <button onClick={() => fetchFeed(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <HiRefresh size={14} /> Refresh
          </button>
        </div>

        {/* Moments */}
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Your feed is empty
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Follow creators to see their Moments here, or explore to discover new vibes.
            </p>
          </motion.div>
        ) : (
          <>
            {moments.map(m => (
              <MomentCard key={m._id} moment={m} onDelete={handleDelete} />
            ))}
            <div ref={sentinelRef} style={{ height: 40 }} />
            {loadingMore && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {!hasMore && moments.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>
                You've seen all recent Moments ✨
              </p>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <RightSidebar />
    </div>
  );
}
