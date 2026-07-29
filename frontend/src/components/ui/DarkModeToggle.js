import { useAuth } from '../../context/AuthContext';

/**
 * Compact dark mode toggle that matches the site's design language:
 * — Same size family as the navbar icon buttons
 * — Uses the site's gray/blue palette, no loud gradients
 * — Subtle sun ↔ moon icon swap inside the thumb
 */
const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useAuth();

  return (
    <>
      <style>{`
        @keyframes dm-spin { to { transform: rotate(360deg); } }
        @keytml dm-blink {
          0%,100% { opacity:.4; } 50% { opacity:1; }
        }
        .dm-thumb {
          transition: left .35s cubic-bezier(.34,1.4,.64,1),
                      background .3s ease,
                      box-shadow .3s ease;
        }
        .dm-icon {
          transition: opacity .2s ease, transform .25s ease;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <button
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Light mode' : 'Dark mode'}
        style={{
          /* Size: fits neatly between the notification bell and avatar */
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          overflow: 'hidden',
          flexShrink: 0,
          outline: 'none',
          /* Background: neutral, not the main blue */
          background: darkMode ? '#2c2c35' : '#e8eaed',
          boxShadow: darkMode
            ? 'inset 0 1px 2px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06)'
            : 'inset 0 1px 2px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.06)',
          transition: 'background .35s ease, box-shadow .35s ease',
        }}
      >
        {/* ── Sliding thumb ── */}
        <span
          className="dm-thumb"
          style={{
            position: 'absolute',
            top: 3,
            left: darkMode ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: darkMode ? '#e8e8f4' : '#ffffff',
            boxShadow: darkMode
              ? '0 1px 4px rgba(0,0,0,.5)'
              : '0 1px 4px rgba(0,0,0,.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Sun — visible in light mode */}
          <span
            className="dm-icon"
            style={{
              opacity: darkMode ? 0 : 1,
              transform: darkMode ? 'scale(0) rotate(90deg)' : 'scale(1) rotate(0deg)',
              animation: !darkMode ? 'dm-spin 12s linear infinite' : 'none',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="none"/>
              <line x1="12" y1="2"  x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="2"  y1="12" x2="5"  y2="12"/>
              <line x1="19" y1="12" x2="22" y2="12"/>
              <line x1="5.6"  y1="5.6"  x2="7.5"  y2="7.5"/>
              <line x1="16.5" y1="16.5" x2="18.4" y2="18.4"/>
              <line x1="5.6"  y1="18.4" x2="7.5"  y2="16.5"/>
              <line x1="16.5" y1="7.5"  x2="18.4" y2="5.6"/>
            </svg>
          </span>

          {/* Moon — visible in dark mode */}
          <span
            className="dm-icon"
            style={{
              opacity: darkMode ? 1 : 0,
              transform: darkMode ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)',
              transitionDelay: darkMode ? '0.08s' : '0s',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#818cf8" stroke="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
        </span>

        {/* ── Track label: tiny dot indicators ── */}
        {/* Light mode: small amber dot on the right side of track */}
        <span style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#fbbf24',
          opacity: darkMode ? 0 : 0.6,
          transition: 'opacity .3s ease',
        }} />
        {/* Dark mode: small indigo dot on left side of track */}
        <span style={{
          position: 'absolute',
          left: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: '#818cf8',
          opacity: darkMode ? 0.7 : 0,
          transition: 'opacity .3s ease',
        }} />
      </button>
    </>
  );
};

export default DarkModeToggle;
