import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

// ── Notification ping sound ──────────────────────────────────────────────────
function pingSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, startAt, dur, vol) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + dur);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + dur + 0.05);
      osc.onended = () => { try { ctx.close(); } catch {} };
    };
    play(1046.5, 0,    0.18, 0.12);
    play(1318.5, 0.12, 0.22, 0.09);
  } catch {}
}

const toastPosition = () => window.innerWidth < 768 ? 'top-center' : 'bottom-right';

// Toast style shared between missed + live messages
const toastStyle = () => ({
  background: 'rgba(15,13,18,0.97)',
  border: '1px solid rgba(167,139,250,0.3)',
  color: 'white',
  maxWidth: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '380px',
  width:    window.innerWidth < 768 ? 'calc(100vw - 32px)' : '380px',
  padding: '14px 16px',
  backdropFilter: 'blur(24px)',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
});

function MsgToastContent({ avatarUrl, senderName, preview, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer' }}>
      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(167,139,250,0.4)' }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'white' }}>{senderName[0]?.toUpperCase()}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{label}</div>}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>@{senderName}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>→</div>
    </div>
  );
}

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Use a ref for activeConvId so the socket listener always sees the current value
  // without needing to be re-registered on every change.
  const activeConvIdRef = useRef(null);
  const [activeConvId, _setActiveConvId] = useState(null);
  const setActiveConvId = useCallback((id) => {
    activeConvIdRef.current = id;
    _setActiveConvId(id);
  }, []);

  // Dedup: track toast IDs shown this session so we never double-fire
  const shownToastIds = useRef(new Set());

  // ── Fetch conversations and compute unread count ─────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    if (!user) { setUnreadMsgCount(0); return; }
    try {
      const { data } = await api.get('/messages/conversations');
      if (!data.success) return;

      let count = 0;
      const missed = [];

      for (const conv of data.conversations || []) {
        const lastMsg  = conv.lastMessage;
        if (!lastMsg) continue;
        const senderId = lastMsg.sender?._id || lastMsg.sender;
        const isMe     = senderId === user._id || senderId?.toString() === user._id?.toString();
        const isSeen   = lastMsg.seenBy?.some(id => id === user._id || id?.toString() === user._id?.toString());
        if (!isMe && !isSeen) {
          count++;
          missed.push({ conv, msg: lastMsg });
        }
      }
      setUnreadMsgCount(count);

      // ── Surface missed messages on first load (once per login session) ──
      // Key is tied to the user so a fresh login always shows them once.
      const sessionKey = `vela_missed_shown_${user._id}`;
      if (missed.length > 0 && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');

        missed.slice(0, 3).forEach((item, i) => {
          const toastId = `missed-${item.msg._id || item.conv._id}`;
          if (shownToastIds.current.has(toastId)) return;

          const other = item.conv.participants?.find(p => {
            const pid = p._id || p;
            return pid !== user._id && pid?.toString() !== user._id?.toString();
          });
          const senderName = other?.username || 'Someone';
          const preview    = item.msg.text
            ? item.msg.text.slice(0, 55) + (item.msg.text.length > 55 ? '…' : '')
            : '📷 Image';

          setTimeout(() => {
            shownToastIds.current.add(toastId);
            toast(
              (t) => (
                <div onClick={() => { toast.dismiss(t.id); window.location.href = '/messages'; }}>
                  <MsgToastContent avatarUrl={other?.profilePicture} senderName={senderName} preview={preview} label="Missed message" />
                </div>
              ),
              { id: toastId, duration: 8000, position: toastPosition(), style: toastStyle() }
            );
          }, i * 900);
        });

        if (missed.length > 3) {
          setTimeout(() => {
            toast(`💬 +${missed.length - 3} more unread message${missed.length - 3 > 1 ? 's' : ''}`, {
              duration: 5000,
              position: toastPosition(),
              style: { background: 'rgba(15,13,18,0.97)', border: '1px solid rgba(167,139,250,0.2)', color: 'white', borderRadius: '14px', cursor: 'pointer' },
              onClick: () => { window.location.href = '/messages'; },
            });
          }, Math.min(missed.length, 3) * 900 + 400);
        }
      }
    } catch {}
  }, [user?._id]);

  // Run on mount and whenever user changes
  useEffect(() => { refreshUnreadCount(); }, [refreshUnreadCount]);

  // ── Real-time: new message arrives via socket ────────────────────────────
  // Registered ONCE per socket instance. Uses activeConvIdRef (always current)
  // instead of including activeConvId in the dependency array, which previously
  // caused the listener to be torn down mid-event and lose messages.
  useEffect(() => {
    if (!socket || !user) return;

    const onReceive = (msg) => {
      const convId = msg.conversationId || msg.conversation;

      // Suppress badge + toast if the user is currently in that conversation
      if (activeConvIdRef.current && activeConvIdRef.current === convId) return;

      // Increment badge
      setUnreadMsgCount(prev => prev + 1);

      // Dedup toasts by message id
      const msgId = msg._id || `${convId}-${msg.createdAt || Date.now()}`;
      if (shownToastIds.current.has(msgId)) return;
      shownToastIds.current.add(msgId);
      // Auto-expire dedup entry after 30s to avoid unbounded growth
      setTimeout(() => shownToastIds.current.delete(msgId), 30_000);

      pingSound();

      const senderName = msg.sender?.username || 'Someone';
      const preview    = msg.text ? msg.text.slice(0, 55) + (msg.text.length > 55 ? '…' : '') : '📷 Image';
      const avatarUrl  = msg.sender?.profilePicture;

      toast(
        (t) => (
          <div onClick={() => { toast.dismiss(t.id); window.location.href = '/messages'; }}>
            <MsgToastContent avatarUrl={avatarUrl} senderName={senderName} preview={preview} label={null} />
          </div>
        ),
        {
          id: `msg-${msgId}`,
          duration: 6000,
          position: toastPosition(),
          style: toastStyle(),
        }
      );
    };

    socket.on('message:receive', onReceive);
    return () => socket.off('message:receive', onReceive);
  // NOTE: intentionally NOT including activeConvId here — we read it via ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?._id]);

  // ── markConvRead: called by MessagesPage when a conversation is opened ───
  // Refreshes the count from the server after a short delay to allow seenBy
  // to be written by the GET /messages/:convId endpoint.
  const markConvRead = useCallback(() => {
    setTimeout(refreshUnreadCount, 800);
  }, [refreshUnreadCount]);

  return (
    <MessageContext.Provider value={{ unreadMsgCount, setUnreadMsgCount, setActiveConvId, markConvRead, refreshUnreadCount }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) return { unreadMsgCount: 0, setActiveConvId: () => {}, markConvRead: () => {}, refreshUnreadCount: () => {} };
  return ctx;
};
