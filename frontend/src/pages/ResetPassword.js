import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

// Password strength checker
const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
};

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);
  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    if (strength < 4) {
      return toast.error('Please choose a stronger password');
    }
    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password: form.password });
      toast.success('Password reset successful! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-2">EveSphere</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Set a new password</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
              required
            />
            {/* Strength bar */}
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: i <= strength ? strengthColors[strength] : '#e5e7eb' }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
            {/* Checklist */}
            {form.password && (
              <ul className="mt-2 space-y-1">
                {[
                  { key: 'length', label: 'At least 8 characters' },
                  { key: 'upper', label: 'One uppercase letter' },
                  { key: 'number', label: 'One number' },
                  { key: 'special', label: 'One special character' },
                ].map(({ key, label }) => (
                  <li key={key} className={`text-xs flex items-center gap-1 ${checks[key] ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{checks[key] ? '✓' : '○'}</span> {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
              required
            />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {form.confirm && form.password === form.confirm && (
              <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || strength < 4 || form.password !== form.confirm}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
