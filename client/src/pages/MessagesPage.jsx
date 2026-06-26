import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPaperAirplane, HiSearch, HiArrowLeft, HiPhotograph,
  HiX, HiReply,
} from 'react-icons/hi';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useMessages } from '../context/MessageContext.jsx';
import toast from 'react-hot-toast';

// ─── Notification sound (real audible ping — louder, correct WAV) ─────────────
function playPing() {
  try {
    // Oscillator-based ping — works cross-browser, no base64 needed
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {}
}

// ─── Browser push notification ────────────────────────────────────────────────
function showBrowserNotif(title, body, icon) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: icon || '/vela-icon.svg',
      tag:  'vela-msg',
      silent: true,   // we play our own sound
      badge: '/vela-icon.svg',
    });
    setTimeout(() => n.close(), 6000);
    n.onclick = () => { window.focus(); n.close(); };
  } else if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ─── Format last seen ─────────────────────────────────────────────────────────
function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Last seen recently';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  if (diffMins < 1)  return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date >= today) return `Last seen today at ${timeStr}`;
  if (date >= yesterday) return `Last seen yesterday at ${timeStr}`;
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

// ─── Avatar — uses socket onlineUsers set (privacy-respecting) ───────────────
function Avatar({ user, size = 44, showOnline = false, onlineUsers = [] }) {
  // onlineUsers is the socket-filtered set — only contains users who allow visibility
  const isOnline = showOnline && onlineUsers.includes(user?._id);
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white' }}>
          {user?.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {isOnline && (
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.25, height: size * 0.25, borderRadius: '50%', background: '#34D399', border: `2px solid var(--bg-base)` }} />
      )}
    </div>
  );
}

// ─── Conversation item ────────────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick, currentUserId, unreadCount, onlineUsers }) {
  const other = conv.participants?.find(p => (p._id || p) !== currentUserId);
  const lastMsg = conv.lastMessage;
  const timeStr = conv.lastMessageAt
    ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <div
      onClick={() => onClick(conv)}
      style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: '14px 16px', cursor: 'pointer',
        background: isActive ? 'rgba(167,139,250,0.08)' : 'transparent',
        borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <Avatar user={other} size={46} showOnline onlineUsers={onlineUsers} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: unreadCount > 0 ? 700 : 600, color: 'var(--text-primary)' }}>@{other?.username}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: unreadCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontWeight: unreadCount > 0 ? 600 : 400 }}>
            {lastMsg ? (lastMsg.sender === currentUserId || lastMsg.sender?._id === currentUserId ? 'You: ' : '') + (lastMsg.text || '📷 Image') : 'Start chatting...'}
          </span>
          {unreadCount > 0 && (
            <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{unreadCount}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reply preview bar ────────────────────────────────────────────────────────
function ReplyBar({ replyTo, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      style={{ padding: '8px 16px', background: 'rgba(167,139,250,0.06)', borderTop: '1px solid rgba(167,139,250,0.15)', flexShrink: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 36, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>Replying to @{replyTo.sender?.username || 'message'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {replyTo.media?.url ? '📷 Image' : replyTo.text?.slice(0, 60) || '...'}
          </div>
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><HiX size={14} /></button>
      </div>
    </motion.div>
  );
}

// ─── Message bubble with hover reply ─────────────────────────────────────────
function MsgBubble({ msg, isMe, showAvatar, sender, onReply, onScrollTo, msgRefs }) {
  const [hovered, setHovered] = useState(false);
  const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isSeen = msg.seenBy?.length > 1;

  return (
    <div
      ref={el => { if (msgRefs && msg._id) msgRefs.current[msg._id] = el; }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 4, position: 'relative' }}
    >
      {!isMe && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && <Avatar user={sender} size={28} />}</div>}

      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
        {/* Reply-to preview */}
        {msg.replyTo && (
          <div
            onClick={() => onScrollTo(msg.replyTo._id || msg.replyTo)}
            style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid var(--accent)', cursor: 'pointer', marginBottom: 2, maxWidth: '100%' }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
              @{msg.replyTo.sender?.username || '…'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {msg.replyTo.media?.url ? '📷 Image' : msg.replyTo.text?.slice(0, 50) || '…'}
            </div>
          </div>
        )}

        {msg.media?.url && (
          <img src={msg.media.url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
        )}
        {msg.text && (
          <div style={{
            padding: '10px 14px',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMe ? 'var(--grad-brand)' : 'rgba(255,255,255,0.06)',
            border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
            fontSize: 14, lineHeight: 1.5, color: 'white',
            boxShadow: isMe ? '0 4px 16px rgba(167,139,250,0.2)' : 'none',
            wordBreak: 'break-word',
          }}>
            {msg.text}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
          <span>{time}</span>
          {isMe && <span style={{ color: isSeen ? 'var(--accent)' : 'var(--text-muted)' }}>{isSeen ? '✓✓' : '✓'}</span>}
        </div>
      </div>

      {/* Hover reply button */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            onClick={() => onReply(msg)}
            style={{
              alignSelf: 'center',
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              order: isMe ? -1 : 1,
            }}
            title="Reply"
          >
            <HiReply size={13} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();  // onlineUsers = privacy-filtered set from server
  const { setActiveConvId, markConvRead } = useMessages();
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const messagesEndRef = useRef();
  const typingTimeout = useRef();
  const msgRefs = useRef({});
  const notifSoundActive = useRef(false);

  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [initDone, setInitDone] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [mobileView, setMobileView] = useState('list');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // message being replied to

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    return () => { setActiveConvId(null); markConvRead(); };
  }, [setActiveConvId, markConvRead]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 60);
  }, []);

  const scrollToMsg = useCallback((msgId) => {
    const el = msgRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.3s';
      el.style.background = 'rgba(167,139,250,0.12)';
      el.style.borderRadius = '12px';
      setTimeout(() => { el.style.background = ''; el.style.borderRadius = ''; }, 1200);
    }
  }, []);

  // Load data
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get('/messages/conversations'),
      api.get('/messages/requests'),
    ]).then(([cRes, rRes]) => {
      if (cRes.data.success) setConversations(cRes.data.conversations || []);
      if (rRes.data.success) setRequests(rRes.data.requests || []);
    }).catch(err => {
      console.error('Load messages error:', err);
      toast.error('Could not load messages.');
    }).finally(() => { setLoading(false); setInitDone(true); });
  }, [user?._id]);

  // Auto-open from URL
  useEffect(() => {
    if (!userId || !initDone) return;
    const found = conversations.find(c => c.participants?.some(p => (p._id || p) === userId));
    if (found) { openConv(found); return; }
    api.post(`/messages/conversation/${userId}`)
      .then(({ data }) => {
        if (data.success) {
          setConversations(prev => [data.conversation, ...prev]);
          openConv(data.conversation);
        }
      })
      .catch(err => {
        const errData = err.response?.data;
        if (errData?.needRequest) {
          api.post(`/messages/request/${userId}`)
            .then(() => toast.success('Message request sent! 📩'))
            .catch(e => {
              const msg = e.response?.data?.message || '';
              toast(msg.includes('already') ? 'Request already sent ⏳' : 'Could not send request.', { icon: '📩' });
            });
        } else {
          toast.error(errData?.message || 'Could not open conversation.');
        }
        navigate('/messages', { replace: true });
      });
  }, [userId, conversations.length, initDone]);

  // Open conversation
  const openConv = useCallback(async (conv) => {
    const other = conv.participants?.find(p => (p._id || p) !== user._id) || conv.participants?.[0];
    setActiveConv(conv);
    setActiveConvId(conv._id);
    setOtherUser(other);
    setMobileView('chat');
    setMessages([]);
    setMsgLoading(true);
    setReplyTo(null);
    socket?.emit('conversation:join', conv._id);
    setUnreadCounts(prev => ({ ...prev, [conv._id]: 0 }));
    markConvRead();
    try {
      const { data } = await api.get(`/messages/${conv._id}`);
      if (data.success) { setMessages(data.messages || []); scrollToBottom('instant'); }
    } catch { toast.error('Could not load messages.'); }
    finally { setMsgLoading(false); }
  }, [user?._id, socket, scrollToBottom, setActiveConvId, markConvRead]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg) => {
      const convId = msg.conversationId || msg.conversation;
      if (activeConv?._id === convId) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        // Don't spam sound in same conversation
        if (!notifSoundActive.current) {
          notifSoundActive.current = true;
          setTimeout(() => { notifSoundActive.current = false; }, 3000);
        }
      } else {
        setUnreadCounts(prev => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }));
        // Sound + browser notification for background conversations
        playPing();
        const senderName = msg.sender?.username || 'Someone';
        showBrowserNotif(`@${senderName}`, msg.text || '📷 sent an image', msg.sender?.profilePicture);
      }
      setConversations(prev => prev.map(c =>
        c._id === convId ? { ...c, lastMessage: msg, lastMessageAt: new Date() } : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
    };
    const onTypingStart = ({ userId: tid }) => { if (otherUser?._id === tid) setOtherTyping(true); };
    const onTypingStop  = ({ userId: tid }) => { if (otherUser?._id === tid) setOtherTyping(false); };
    socket.on('message:receive', onReceive);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:receive', onReceive);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, activeConv?._id, otherUser?._id, scrollToBottom]);

  // Typing
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activeConv) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing:start', { conversationId: activeConv._id, userId: user._id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing:stop', { conversationId: activeConv._id, userId: user._id });
    }, 1500);
  };

  // Send message
  const sendMsg = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !imageFile) || !activeConv) return;
    const tempText = text;
    const tempFile = imageFile;
    const tempReply = replyTo;
    setText(''); setImageFile(null); setImagePreview(null); setReplyTo(null);

    try {
      let res;
      if (tempFile) {
        const fd = new FormData();
        fd.append('text', tempText);
        fd.append('image', tempFile);
        if (tempReply) fd.append('replyToId', tempReply._id);
        res = await api.post(`/messages/${activeConv._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post(`/messages/${activeConv._id}`, { text: tempText, replyToId: tempReply?._id });
      }
      if (res.data.success) {
        const msg = res.data.message;
        setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
        setConversations(prev => prev.map(c => c._id === activeConv._id ? { ...c, lastMessage: msg, lastMessageAt: new Date() } : c));
        socket?.emit('message:send', { ...msg, conversationId: activeConv._id });
        setTyping(false);
        socket?.emit('typing:stop', { conversationId: activeConv._id, userId: user._id });
        scrollToBottom();
      }
    } catch { toast.error('Could not send.'); setText(tempText); setImageFile(tempFile); setReplyTo(tempReply); }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const respondRequest = async (senderId, action) => {
    try {
      const { data } = await api.put(`/messages/request/${senderId}`, { action });
      setRequests(prev => prev.filter(r => r.from._id !== senderId));
      if (action === 'accept' && data.conversation) {
        setConversations(prev => [data.conversation, ...prev]);
        openConv(data.conversation);
        toast.success('Request accepted! 🎉');
      } else {
        toast('Request declined.', { icon: '👋' });
      }
    } catch { toast.error('Could not respond.'); }
  };

  const filteredConvs = conversations.filter(c => {
    if (!search) return true;
    const other = c.participants?.find(p => (p._id || p) !== user._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  // ── SIDEBAR ──────────────────────────────────────────────────────────────
  const SidebarPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding: '20px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>Chats</h2>
          {requests.length > 0 && (
            <button onClick={() => setShowRequests(!showRequests)} style={{ position: 'relative', width: 34, height: 34, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              📩
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, background: 'var(--accent)', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{requests.length}</div>
            </button>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <HiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: 15 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..." className="input-vela" style={{ paddingLeft: 32, height: 38, fontSize: 13 }} />
        </div>
      </div>

      <AnimatePresence>
        {showRequests && requests.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ padding: '8px 16px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Message Requests</div>
              {requests.map(req => (
                <div key={req.from._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Avatar user={req.from} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>@{req.from.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wants to message you</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => respondRequest(req.from._id, 'accept')} style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--grad-brand)', color: 'white', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Accept</button>
                    <button onClick={() => respondRequest(req.from._id, 'reject')} style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '55%', height: 12, borderRadius: 4, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '75%', height: 10, borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : filteredConvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{search ? 'No results' : 'No conversations yet'}</div>
            {!search && <Link to="/explore" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Find creators →</Link>}
          </div>
        ) : (
          filteredConvs.map(conv => (
            <ConvItem key={conv._id} conv={conv} isActive={activeConv?._id === conv._id} onClick={openConv} currentUserId={user._id} unreadCount={unreadCounts[conv._id] || 0} onlineUsers={onlineUsers} />
          ))
        )}
      </div>
    </div>
  );

  // ── CHAT AREA ─────────────────────────────────────────────────────────────
  const ChatArea = activeConv ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={() => { setMobileView('list'); setActiveConv(null); setActiveConvId(null); }} style={{ display: 'none', width: 34, height: 34, borderRadius: 9, background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="msg-back-btn">
          <HiArrowLeft size={18} />
        </button>
        <Avatar user={otherUser} size={40} showOnline onlineUsers={onlineUsers} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/profile/${otherUser?.username}`} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'block' }}>@{otherUser?.username}</Link>
          {(() => {
            const isOnlineNow = onlineUsers.includes(otherUser?._id);
            return (
              <div style={{ fontSize: 12, color: isOnlineNow ? '#34D399' : 'var(--text-muted)' }}>
                {isOnlineNow ? '● Online' : formatLastSeen(otherUser?.lastSeen)}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 8px', display: 'flex', flexDirection: 'column' }}>
        {msgLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
            <Avatar user={otherUser} size={72} />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>@{otherUser?.username}</div>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>Send a message to start your conversation ✨</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = (msg.sender?._id || msg.sender) === user._id;
            const prevMsg = messages[i - 1];
            const sameAsPrev = prevMsg && (prevMsg.sender?._id || prevMsg.sender) === (msg.sender?._id || msg.sender);
            return (
              <MsgBubble
                key={msg._id || i}
                msg={msg}
                isMe={isMe}
                showAvatar={!sameAsPrev}
                sender={isMe ? user : otherUser}
                onReply={setReplyTo}
                onScrollTo={scrollToMsg}
                msgRefs={msgRefs}
              />
            );
          })
        )}
        <AnimatePresence>
          {otherTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
              <Avatar user={otherUser} size={28} />
              <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 4 }}>
                {[0,1,2].map(j => <motion.div key={j} animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: j*0.15 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && <ReplyBar replyTo={replyTo} onClear={() => setReplyTo(null)} />}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ padding: '8px 20px', background: 'var(--bg-surface)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={imagePreview} alt="" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}><HiX /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <form onSubmit={sendMsg} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HiPhotograph size={18} />
          </button>
          <input
            value={text}
            onChange={handleTyping}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder={replyTo ? `Reply to @${replyTo.sender?.username || 'message'}...` : `Message @${otherUser?.username}...`}
            className="input-vela"
            style={{ flex: 1, height: 42, fontSize: 14, borderRadius: 12 }}
          />
          <motion.button
            type="submit"
            disabled={!text.trim() && !imageFile}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: (text.trim() || imageFile) ? 'var(--grad-brand)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: (text.trim() || imageFile) ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            <HiPaperAirplane size={18} style={{ transform: 'rotate(90deg)' }} />
          </motion.button>
        </form>
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-base)', color: 'var(--text-muted)', gap: 12 }}>
      <div style={{ fontSize: 64 }}>💬</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Your Messages</h3>
      <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>Select a conversation or go to a profile and tap the message icon.</p>
      <Link to="/explore" style={{ padding: '10px 24px', borderRadius: 12, background: 'var(--grad-brand)', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none', marginTop: 8 }}>Find Creators</Link>
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .msg-layout-desktop { display: none !important; }
          .msg-layout-mobile  { display: flex !important; }
          .msg-back-btn       { display: flex !important; }
        }
        @media (min-width: 769px) {
          .msg-layout-desktop { display: grid !important; }
          .msg-layout-mobile  { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="msg-layout-desktop" style={{ gridTemplateColumns: '300px 1fr', height: '100vh', overflow: 'hidden', display: 'none' }}>
        <div style={{ overflow: 'hidden' }}>{SidebarPanel}</div>
        <div style={{ overflow: 'hidden' }}>{ChatArea}</div>
      </div>
      <div className="msg-layout-mobile" style={{ flexDirection: 'column', height: '100vh', overflow: 'hidden', display: 'none' }}>
        <AnimatePresence mode="wait">
          {mobileView === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} style={{ height: '100%', overflow: 'hidden' }}>
              {SidebarPanel}
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }} style={{ height: '100%', overflow: 'hidden' }}>
              {ChatArea}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
