import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-2">EveSphere</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Reset your password</p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Check your email</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly. The link expires in 1 hour.
            </p>
            <Link to="/login" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm">
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your registered email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                ← Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
