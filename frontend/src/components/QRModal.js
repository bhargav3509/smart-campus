import { useState, useEffect } from 'react';
import API from '../services/api';

const QRModal = ({ event, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQR();
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white text-center">
          <p className="text-xs uppercase tracking-widest mb-1 opacity-80">Smart Campus</p>
          <h2 className="text-xl font-bold">{event.title}</h2>
          <span className="inline-block mt-2 bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
            ✓ Registered
          </span>
        </div>

        {/* Event Details */}
        <div className="px-6 py-4 border-b border-dashed border-gray-200 dark:border-gray-600">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm text-center py-4">❌ {error}</p>
          ) : qrData ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{qrData.venue || 'TBA'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{new Date(qrData.start_time).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span>{new Date(qrData.start_time).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* QR Code */}
        {!loading && !error && qrData && (
          <div className="px-6 py-4 flex flex-col items-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
              Show at entrance
            </p>
            <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-100">
              <img
                src={qrData.qr_code}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Scan to verify registration
            </p>
          </div>
        )}

        {/* Dashed divider */}
        <div className="mx-6 border-t border-dashed border-gray-200 dark:border-gray-600" />

        {/* Actions */}
        <div className="px-6 py-4 space-y-2">
          {!loading && !error && qrData && (
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ⬇️ Download Ticket
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRModal;