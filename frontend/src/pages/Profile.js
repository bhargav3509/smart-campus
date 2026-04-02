import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';

const Profile = () => {
  const { user, login, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    department: '',
    branch: '',
    section: '',
    uid: '',
    designation: '',
    employee_id: '',
    office: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        department: res.data.department || '',
        branch: res.data.branch || '',
        section: res.data.section || '',
        uid: res.data.uid || '',
        designation: res.data.designation || '',
        employee_id: res.data.employee_id || '',
        office: res.data.office || '',
        bio: res.data.bio || '',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/profile/me', form);
      setProfile(res.data);
      login(res.data, token);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const res = await API.put('/profile/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    }
  };

  const goBack = () => {
    if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'faculty') navigate('/faculty');
    else navigate('/student');
  };

  const inputClass = "w-full border dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";

  // Role-specific profile detail fields
  const getProfileFields = () => {
    const common = [
      { label: 'Full Name', value: profile?.name, icon: '👤' },
      { label: 'Email', value: profile?.email, icon: '📧' },
      { label: 'Phone', value: profile?.phone || 'Not set', icon: '📱' },
      { label: 'Department', value: profile?.department || 'Not set', icon: '🏛️' },
      { label: 'Role', value: profile?.role, icon: '🎭' },
      { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—', icon: '📅' },
    ];

    if (profile?.role === 'student') {
      return [
        ...common,
        { label: 'UID / Roll No', value: profile?.uid || 'Not set', icon: '🪪' },
        { label: 'Branch', value: profile?.branch || 'Not set', icon: '📚' },
        { label: 'Section', value: profile?.section || 'Not set', icon: '🔤' },
      ];
    }

    if (profile?.role === 'faculty') {
      return [
        ...common,
        { label: 'Employee ID', value: profile?.employee_id || 'Not set', icon: '🪪' },
        { label: 'Designation', value: profile?.designation || 'Not set', icon: '💼' },
        { label: 'Office', value: profile?.office || 'Not set', icon: '🏢' },
      ];
    }

    if (profile?.role === 'admin') {
      return [
        ...common,
        { label: 'Employee ID', value: profile?.employee_id || 'Not set', icon: '🪪' },
        { label: 'Designation', value: profile?.designation || 'Not set', icon: '💼' },
      ];
    }

    return common;
  };

  // Role-specific edit form fields
  const renderRoleFields = () => {
    if (profile?.role === 'student') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>UID / Roll Number</label>
              <input type="text" placeholder="e.g. 22BCS001" value={form.uid}
                onChange={e => setForm({ ...form, uid: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Branch</label>
              <input type="text" placeholder="e.g. B.Tech CSE" value={form.branch}
                onChange={e => setForm({ ...form, branch: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Section</label>
            <input type="text" placeholder="e.g. A / B / C" value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}
              className={inputClass} />
          </div>
        </>
      );
    }

    if (profile?.role === 'faculty') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Employee ID</label>
              <input type="text" placeholder="e.g. FAC001" value={form.employee_id}
                onChange={e => setForm({ ...form, employee_id: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input type="text" placeholder="e.g. Assistant Professor" value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Office</label>
            <input type="text" placeholder="e.g. Room 204, Block B" value={form.office}
              onChange={e => setForm({ ...form, office: e.target.value })}
              className={inputClass} />
          </div>
        </>
      );
    }

    if (profile?.role === 'admin') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Employee ID</label>
            <input type="text" placeholder="e.g. ADM001" value={form.employee_id}
              onChange={e => setForm({ ...form, employee_id: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input type="text" placeholder="e.g. Campus Administrator" value={form.designation}
              onChange={e => setForm({ ...form, designation: e.target.value })}
              className={inputClass} />
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm font-semibold transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <NotificationBell />
          <button onClick={logout} className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : profile?.avatar_url ? (
                  <img src={`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${profile.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-300">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-blue-700 text-xs">
                ✏️
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                  }}
                />
              </label>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                  profile?.role === 'admin' ? 'bg-red-100 text-red-700' :
                  profile?.role === 'faculty' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {profile?.role}
                </span>
                {profile?.role === 'student' && profile?.uid && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    UID: {profile.uid}
                  </span>
                )}
                {(profile?.role === 'faculty' || profile?.role === 'admin') && profile?.designation && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {profile.designation}
                  </span>
                )}
              </div>
              {profile?.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{profile.bio}"</p>
              )}
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                editing
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editing ? 'Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          {avatarFile && (
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">New avatar selected</p>
              <button onClick={handleAvatarUpload}
                className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700">
                Upload Avatar
              </button>
              <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                className="text-red-500 text-sm hover:underline">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Edit Profile</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="text" placeholder="+91 XXXXX XXXXX" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Department</label>
              <input type="text" placeholder="e.g. Computer Science" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className={inputClass} />
            </div>

            {/* Role specific fields */}
            {renderRoleFields()}

            <div>
              <label className={labelClass}>Bio</label>
              <textarea placeholder="Tell something about yourself..." value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                className={inputClass} rows={3} />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Profile Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Profile Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {getProfileFields().map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{icon} {label}</p>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;