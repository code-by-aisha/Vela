import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiUserAdd, HiUserRemove, HiChat, HiPencil, HiLightningBolt, HiPhotograph, HiPlay, HiDotsCircleHorizontal } from 'react-icons/hi';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import FollowersModal from '../components/profile/FollowersModal.jsx';

// Mini story ring shown at top of profile
function StoryRing({ story, onClick }) {
  return (
    <button
      onClick={() => onClick(story)}
      style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
      }}
    >
      <div style={{
        width: 58, height: 58, borderRadius: '50%',
        background: 'var(--grad-brand)',
        padding: 2,
        boxShadow: '0 0 12px var(--accent-glow)',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--bg-surface)' }}>
          {story.thumbnail || story.media?.url ? (
            <img
              src={story.thumbnail || story.media?.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiPlay size={18} color="var(--accent)" />
            </div>
          )}
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Story
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [moments, setMoments]         = useState([]);
  const [stories, setStories]         = useState([]);
  const [momentCount, setMomentCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab]                 = useState('moments');
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null

  // Load profile, moments, and stories
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, momentsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/users/${username}/moments`),
        ]);

        if (profileRes.data.success) {
          const u = profileRes.data.user;
          setProfile(u);
          setMomentCount(profileRes.data.momentCount ?? 0);
          setIsFollowing(
            u.followers?.some(f => (f._id || f) === currentUser?._id)
          );

          // Load stories for this user
          try {
            const storiesRes = await api.get(`/stories/user/${u._id}`);
            if (storiesRes.data.success) setStories(storiesRes.data.stories || []);
          } catch { /* stories are non-critical */ }
        }
        if (momentsRes.data.success) setMoments(momentsRes.data.moments || []);
      } catch {
        toast.error('Profile not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, currentUser?._id]);

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${profile._id}/follow`);
      setIsFollowing(data.following);
      setProfile(p => ({
        ...p,
        followers: data.following
          ? [...(p.followers || []), { _id: currentUser._id }]
          : (p.followers || []).filter(f => (f._id || f) !== currentUser._id),
      }));
    } catch {
      toast.error('Could not follow.');
    }
  };

  if (loading) return (
    <div style={{ padding: '40px 16px', maxWidth: 700, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 'var(--radius-xl)', marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 160, height: 18, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😶</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>User not found</h2>
    </div>
  );

  const isOwn      = currentUser?._id === profile._id;
  const vibePercent = Math.min(100, ((profile.vibeScore || 0) / 500) * 100);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 60px' }}>

      {/* ── Cover photo ── */}
      <div style={{ position: 'relative', height: 200, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--mauve), var(--grape), var(--slate))', opacity: 0.5 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,13,18,0.85) 0%, transparent 55%)' }} />
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Avatar row ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: -48, marginBottom: 16, gap: 12,
          flexWrap: 'wrap',
        }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'relative', flexShrink: 0 }}>
            {profile.profilePicture ? (
              /* cache-bust with timestamp so new uploads always show */
              <img
                src={`${profile.profilePicture}${profile.profilePicture.includes('?') ? '&' : '?'}v=${profile.updatedAt || Date.now()}`}
                alt={profile.username}
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
              />
            ) : (
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'white', border: '3px solid var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}>
                {profile.username[0].toUpperCase()}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6, flexShrink: 0 }}>
            {isOwn ? (
              <Link to="/settings" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 600,
                background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}>
                <HiPencil size={14} /> Edit Profile
              </Link>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleFollow}
                  style={{
                    padding: '7px 18px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    background: isFollowing ? 'var(--bg-glass)' : 'var(--grad-brand)',
                    border: isFollowing ? '1px solid var(--bg-glass-border)' : 'none',
                    color: isFollowing ? 'var(--text-secondary)' : 'white',
                    boxShadow: isFollowing ? 'none' : '0 0 16px var(--accent-glow)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {isFollowing ? <><HiUserRemove size={14} /> Following</> : <><HiUserAdd size={14} /> Follow</>}
                </motion.button>
                <Link to={`/messages/${profile._id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
                  color: 'var(--text-secondary)',
                }}>
                  <HiChat size={16} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Name / bio ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>@{profile.username}</h1>
            <span className="aura-badge">{profile.aura}</span>
          </div>

          {profile.bio && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{profile.bio}</p>
          )}

          {/* Vibe score */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <HiLightningBolt style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Vibe Score</span>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{profile.vibeScore || 0}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-glass)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${vibePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: 'var(--grad-aura)', borderRadius: 99 }}
              />
            </div>
          </div>

          {/* ── Clickable stats — TikTok-style privacy ── */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid var(--bg-glass-border)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{momentCount}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Moments</div>
            </div>

            <button
              onClick={() => setFollowModal('followers')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              {/* Always show real count — privacy only hides the LIST, not the number */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile.followersHidden ? (profile.followersCount ?? 0) : (profile.followers?.length ?? 0)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline dotted' }}>Followers</div>
            </button>

            <button
              onClick={() => setFollowModal('following')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile.followingHidden ? (profile.followingCount ?? 0) : (profile.following?.length ?? 0)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline dotted' }}>Following</div>
            </button>
          </div>
        </motion.div>

        {/* ── Stories strip ── */}
        {stories.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
              ✨ Stories
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {stories.map(s => (
                <StoryRing key={s._id} story={s} onClick={() => navigate(`/stories?story=${s._id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {['moments', 'saved'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 18px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 600,
                background: tab === t ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${tab === t ? 'rgba(167,139,250,0.3)' : 'transparent'}`,
                color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {t === 'moments' ? '✨ Moments' : '🔖 Saved'}
            </button>
          ))}
        </div>

        {/* ── Moments grid (mobile-safe: minmax so cells never overflow) ── */}
        {tab === 'moments' && (
          moments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <HiPhotograph size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No Moments yet.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 3,
            }}>
              {moments.map(m => (
                <Link
                  to={`/moment/${m._id}`}
                  key={m._id}
                  style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 4, position: 'relative', display: 'block' }}
                >
                  {m.media?.[0]?.type === 'video' ? (
                    <>
                      <video src={m.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 4, right: 4 }}>
                        <HiPlay size={14} color="white" />
                      </div>
                    </>
                  ) : m.media?.[0] ? (
                    <img src={m.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden' }}>
                        {m.caption?.slice(0, 50)}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Followers / Following modal ── */}
      {followModal && (
        <FollowersModal
          userId={profile._id}
          mode={followModal}
          isHidden={followModal === 'followers' ? !!profile.followersHidden : !!profile.followingHidden}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
