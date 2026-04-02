import { useAuth } from '../context/AuthContext';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useAuth();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ backgroundColor: darkMode ? '#3b82f6' : '#d1d5db' }}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
        style={{ transform: darkMode ? 'translateX(24px)' : 'translateX(0)' }}
      />
      <span className="absolute inset-0 flex items-center justify-between px-1 text-xs pointer-events-none">
        <span>{darkMode ? '' : '☀️'}</span>
        <span>{darkMode ? '🌙' : ''}</span>
      </span>
    </button>
  );
};

export default DarkModeToggle;