/**
 * CommentInput — shared comment input with emoji picker for VELA.
 *
 * Used by:
 *   - MomentCard (Home Feed)
 *   - ReelCard comment drawer (Explore)
 *
 * Key design decisions:
 *   1. Emoji picker is rendered via ReactDOM.createPortal into document.body,
 *      so it is NEVER clipped by any ancestor overflow:hidden.
 *   2. Every emoji <button> carries type="button" so clicking inside a <form>
 *      never triggers form submission.
 *   3. onPick only inserts the emoji — it does NOT close the picker and does
 *      NOT call any submit handler.
 *   4. Submission only happens on explicit Post button click or Enter key.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Emoji data ────────────────────────────────────────────────────────────────
const EMOJI_ROWS = [
  ['😍','😂','❤️','🔥','😮','😢','🤯','🫶','✨','👏'],
  ['😊','😎','🥰','😘','🙏','💯','🎉','🎵','🌙','💫'],
  ['😅','😭','🥺','😤','🤩','🥳','😴','🤔','😏','😈'],
  ['💕','💔','💀','👀','🫠','🫣','😇','🤗','😬','🫡'],
];

// ── Portal emoji picker ───────────────────────────────────────────────────────
// Mounts into document.body so overflow:hidden ancestors can NEVER clip it.
function EmojiPickerPortal({ anchorRef, onPick, onClose }) {
  const pickerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: true });

  // Position the picker relative to the emoji button on every render
  useEffect(() => {
    if (!anchorRef.current) return;

    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const pickerH = 178; // approx height of 4 emoji rows
      const pickerW = 232;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Decide vertical direction
      const spaceAbove = rect.top;
      const spaceBelow = vh - rect.bottom;
      const openUp = spaceAbove >= pickerH || spaceAbove > spaceBelow;

      // Horizontal: prefer right-aligned to anchor, but clamp inside viewport
      let left = rect.right - pickerW;
      if (left < 8) left = 8;
      if (left + pickerW > vw - 8) left = vw - pickerW - 8;

      const top = openUp
        ? rect.top - pickerH - 6
        : rect.bottom + 6;

      setPos({ top, left, openUp });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef]);

  // Close when clicking outside the picker
  useEffect(() => {
    const onPointerDown = (e) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    // Use capture so it fires before any stopPropagation in children
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.88, y: pos.openUp ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: pos.openUp ? 8 : -8 }}
      transition={{ duration: 0.14, ease: [0.25, 0.4, 0.25, 1] }}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 99998, // below the grain overlay (99999) but above everything else
        background: 'rgba(16,14,22,0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 14,
        padding: '10px 8px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        minWidth: 232,
        userSelect: 'none',
      }}
    >
      {EMOJI_ROWS.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: ri < EMOJI_ROWS.length - 1 ? 2 : 0,
          }}
        >
          {row.map((em) => (
            <button
              key={em}
              // CRITICAL: type="button" prevents form submission when this
              // picker is used inside a <form> element.
              type="button"
              onPointerDown={(e) => {
                // Stop the pointerdown from reaching the outside-click handler
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPick(em);
                // Do NOT call onClose() here — keeps picker open so users can
                // pick multiple emojis in a row. They close via Escape,
                // clicking outside, or clicking the toggle button again.
              }}
              style={{
                fontSize: 19,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 5px',
                borderRadius: 7,
                lineHeight: 1,
                transition: 'background 0.1s',
                // Ensures touch targets are large enough on mobile
                minWidth: 34,
                minHeight: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {em}
            </button>
          ))}
        </div>
      ))}
    </motion.div>,
    document.body
  );
}

// ── CommentInput ──────────────────────────────────────────────────────────────
/**
 * @param {string}   value          Controlled input value
 * @param {Function} onChange       Called with new string value
 * @param {Function} onSubmit       Called when the user clicks Post or presses Enter
 * @param {string}   placeholder    Input placeholder text (default: "Add a comment...")
 * @param {boolean}  submitting     Disables Post button while in-flight
 * @param {string}   submitLabel    Text on the submit button (default: "Post")
 * @param {object}   inputStyle     Extra inline styles for the <input>
 * @param {object}   containerStyle Extra inline styles for the outer wrapper
 * @param {boolean}  autoFocus      Whether to autofocus the input
 */
export default function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a comment...',
  submitting = false,
  submitLabel = 'Post',
  inputStyle = {},
  containerStyle = {},
  autoFocus = false,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const inputRef  = useRef(null);
  const toggleRef = useRef(null); // anchor for picker positioning

  // Insert emoji at the current cursor position
  const insertEmoji = useCallback((em) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + em);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end   = el.selectionEnd   ?? value.length;
    const next  = value.slice(0, start) + em + value.slice(end);
    onChange(next);
    // Restore cursor position after React re-renders the input
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + em.length, start + em.length);
    });
  }, [value, onChange]);

  // Handle Enter key — submit only on plain Enter (not Shift+Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !submitting) onSubmit();
    }
  };

  // Close picker when this component unmounts
  useEffect(() => () => setShowPicker(false), []);

  const canSubmit = value.trim().length > 0 && !submitting;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        position: 'relative',
        ...containerStyle,
      }}
    >
      {/* Input wrapper */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="input-vela"
          style={{
            width: '100%',
            padding: '9px 42px 9px 14px',
            fontSize: 13,
            boxSizing: 'border-box',
            ...inputStyle,
          }}
        />

        {/* Emoji toggle button — anchors the portal picker */}
        <button
          ref={toggleRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPicker((p) => !p);
          }}
          title={showPicker ? 'Close emoji picker' : 'Add emoji'}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 17,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
            opacity: showPicker ? 1 : 0.7,
            transition: 'opacity 0.15s, transform 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = showPicker ? '1' : '0.7')}
        >
          {showPicker ? '🙂' : '😊'}
        </button>
      </div>

      {/* Post button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (canSubmit) onSubmit();
        }}
        className="btn btn-accent"
        style={{
          padding: '9px 16px',
          fontSize: 13,
          flexShrink: 0,
          opacity: canSubmit ? 1 : 0.45,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.15s',
        }}
      >
        {submitting ? '…' : submitLabel}
      </button>

      {/* Portal picker — renders into document.body, never clipped */}
      <AnimatePresence>
        {showPicker && (
          <EmojiPickerPortal
            anchorRef={toggleRef}
            onPick={insertEmoji}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
