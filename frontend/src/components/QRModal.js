import { useState, useEffect } from 'react';
import API from '../services/api';
import gsap from 'gsap';

const BLUE = '#1a73e8';

// SVG Icons
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const QRModal = ({ event, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQR();
    gsap.from('.modal-content', { scale: 0.9, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' });
  }, []);

  const fetchQR = async () => {
    try {
      const res = await API.get(`/events/${event.id}/qr`);
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrData.qr_code;
    link.download = `ticket-${event.title.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="modal-content bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">

        {/* Header */}
        <div className="px-8 py-6 text-center" style={{ backgroundColor: BLUE }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/70">EveSphere Ticket</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-3" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
            {event.title}
          </h2>
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Registered
          </span>
        </div>

        {/* Event Details */}
        <div className="px-8 py-6 border-b border-dashed border-gray-100">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent transparent transparent` }} />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-red-500 mb-2">
                <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          ) : qrData ? (
            <div className="text-[13px] text-gray-500 space-y-3">
              <div className="flex items-center gap-3 font-semibold text-gray-700">
                <IconLocation /> {qrData.venue || 'TBA'}
              </div>
              <div className="flex items-center gap-3 font-semibold text-gray-700">
                <IconCalendar /> {new Date(qrData.start_time).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-3 font-semibold text-gray-700">
                <IconClock /> {new Date(qrData.start_time).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* QR Code */}
        {!loading && !error && qrData && (
          <div className="px-8 py-6 flex flex-col items-center">
            <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
              Entrance Pass
            </p>
            <div className="bg-white p-4 rounded-3xl shadow-inner border border-gray-50">
              <img
                src={qrData.qr_code}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-4 text-center">
              Present this code at the event check-in
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 py-6 pt-2 space-y-3">
          {!loading && !error && qrData && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{ backgroundColor: BLUE }}
            >
              <IconDownload /> Download Ticket
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRModal;