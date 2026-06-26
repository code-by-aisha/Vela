import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft } from 'react-icons/hi';
import api from '../utils/api.js';
import MomentCard from '../components/feed/MomentCard.jsx';
import toast from 'react-hot-toast';

export default function MomentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moment, setMoment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/moments/${id}`).then(({ data }) => {
      if (data.success) setMoment(data.moment);
      else toast.error('Moment not found.');
    }).catch(() => toast.error('Moment not found.')).finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
      <button onClick={() => navigate(-1)} style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
        fontSize: 14, color: 'var(--text-secondary)',
        background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <HiArrowLeft size={18} /> Back
      </button>

      {loading ? (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '100%', height: 400 }} />
        </div>
      ) : moment ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <MomentCard moment={moment} onDelete={() => navigate('/')} />
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😶</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Moment not found</h2>
          <Link to="/feed" style={{ color: 'var(--accent)', fontSize: 14 }}>Back to feed</Link>
        </div>
      )}
    </div>
  );
}
