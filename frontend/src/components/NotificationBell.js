import { useState, useEffect } from 'react';
import API from '../services/api';

const BLUE = '#1a73e8';
const RED = '#ea4335';

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-container')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notif-container relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-full text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none"
            style={{ backgroundColor: RED, fontSize: '10px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl z-50 overflow-hidden border border-gray-100"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm" style={{ fontFamily: '"Big Shoulders Display", sans-serif', fontSize: '16px' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-bold hover:underline transition"
                style={{ color: BLUE }}>
                <IconCheck /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className="px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors"
                  style={{ backgroundColor: n.is_read ? 'white' : `${BLUE}08` }}>
                  <div className="flex items-start gap-2.5">
                    {!n.is_read && (
                      <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: BLUE }} />
                    )}
                    <div className={n.is_read ? 'pl-4' : ''}>
                      <p className={`text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;