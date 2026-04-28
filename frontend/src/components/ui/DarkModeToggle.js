import { useAuth } from '../../context/AuthContext';

/* Unique "Celestial Orbit" dark mode toggle */
const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useAuth();

  return (
    <>
      <style>{`
        @keyframes sun-spin  { to { transform: rotate(360deg); } }
        @keyframes star-blink {
          0%,100% { opacity:.25; transform:scale(.8); }
          50%      { opacity:1;   transform:scale(1.3); }
        }
        .dm-pill { transition: background .55s cubic-bezier(.4,0,.2,1); }
        .dm-thumb { transition: left .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s ease; }
        .dm-thumb:hover { filter: brightness(1.05); }
        .dm-icon  { transition: opacity .25s ease, transform .3s ease; }
      `}</style>

      <button
        onClick={toggleDarkMode}
        title={darkMode ? 'Light Mode' : 'Dark Mode'}
        className="dm-pill relative flex-shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        style={{
          width: 60, height: 30, overflow: 'hidden', border: 'none', cursor: 'pointer',
          background: darkMode
            ? 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)'
            : 'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
        }}
      >
        {/* ── Stars (dark mode only) ── */}
        {[
          { t:5,  l:9,  s:2,   d:1.2 },
          { t:14, l:13, s:1.5, d:1.6 },
          { t:7,  l:22, s:2,   d:2.0 },
          { t:18, l:20, s:1.5, d:1.4 },
          { t:5,  l:32, s:1.5, d:1.8 },
          { t:18, l:36, s:1,   d:1.1 },
        ].map(({ t, l, s, d }, i) => (
          <span key={i} style={{
            position: 'absolute', top: t, left: l,
            width: s, height: s, borderRadius: '50%', backgroundColor: '#fff',
            opacity: darkMode ? 1 : 0,
            transition: `opacity .4s ease ${i * 60}ms`,
            animation: darkMode ? `star-blink ${d}s ease-in-out infinite` : 'none',
          }} />
        ))}

        {/* ── Shooting-star accent (dark) ── */}
        <span style={{
          position: 'absolute', top: 11, left: 6, width: 14, height: 1,
          borderRadius: 4, background: 'linear-gradient(90deg,#fff,transparent)',
          opacity: darkMode ? .35 : 0, transition: 'opacity .4s ease',
        }} />

        {/* ── Cloud wisps (light mode) ── */}
        <span style={{
          position:'absolute', right: 8, top: 9, width: 18, height: 5,
          borderRadius: 10, background: 'rgba(255,255,255,0.55)',
          opacity: darkMode ? 0 : 1, transition: 'opacity .4s ease',
          boxShadow:'0 3px 0 2px rgba(255,255,255,0.35)',
        }} />

        {/* ── Sliding thumb ── */}
        <span className="dm-thumb" style={{
          position: 'absolute', top: 4,
          left: darkMode ? 32 : 4,
          width: 22, height: 22, borderRadius: '50%',
          background: darkMode
            ? 'radial-gradient(circle at 35% 35%, #e8e8ff, #c7c7ee)'
            : 'radial-gradient(circle at 40% 35%, #fff9e0, #ffe066)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: darkMode
            ? '0 2px 10px rgba(0,0,0,.55), inset 0 -2px 5px rgba(100,100,200,.25)'
            : '0 2px 8px rgba(240,140,0,.45), inset 0 -1px 3px rgba(255,180,0,.3)',
        }}>
          {/* Sun icon — visible in light mode */}
          <span className="dm-icon" style={{
            position: 'absolute',
            opacity: darkMode ? 0 : 1,
            transform: darkMode ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
            animation: !darkMode ? 'sun-spin 9s linear infinite' : 'none',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="none"/>
              <line x1="12" y1="2"  x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="2"  y1="12" x2="5"  y2="12"/>
              <line x1="19" y1="12" x2="22" y2="12"/>
              <line x1="5.6"  y1="5.6"  x2="7.7"  y2="7.7"/>
              <line x1="16.3" y1="16.3" x2="18.4" y2="18.4"/>
              <line x1="5.6"  y1="18.4" x2="7.7"  y2="16.3"/>
              <line x1="16.3" y1="7.7"  x2="18.4" y2="5.6"/>
            </svg>
          </span>

          {/* Moon icon — visible in dark mode */}
          <span className="dm-icon" style={{
            position: 'absolute',
            opacity: darkMode ? 1 : 0,
            transform: darkMode ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(90deg)',
            transitionDelay: darkMode ? '0.1s' : '0s',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#818cf8" stroke="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
        </span>
      </button>
    </>
  );
};

export default DarkModeToggle;
