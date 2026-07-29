import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FullPageSpinner } from '../components/ui/Spinner';

const BLUE = '#1a73e8';

const IconUser    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconHome    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

const IC = 'w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';

/* ── Role badge colours ── */
const ROLE_COLOR = {
  student: { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'   },
  faculty: { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100'  },
  admin:   { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
};

/* ── View fields per role ── */
const VIEW_FIELDS = {
  student: (p) => [
    { label: 'Email',         value: p?.email },
    { label: 'Account',       value: 'Active ✓', green: true },
    { label: 'Member Since',  value: p?.created_at ? new Date(p.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—' },
    { label: 'Department',    value: p?.department  || '—' },
    { label: 'Phone',         value: p?.phone       || '—' },
    { label: 'Branch',        value: p?.branch      || '—' },
    { label: 'Section',       value: p?.section     || '—' },
    { label: 'Roll / UID',    value: p?.uid         || '—' },
  ],
  faculty: (p) => [
    { label: 'Email',         value: p?.email },
    { label: 'Account',       value: 'Active ✓', green: true },
    { label: 'Member Since',  value: p?.created_at ? new Date(p.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—' },
    { label: 'Department',    value: p?.department  || '—' },
    { label: 'Phone',         value: p?.phone       || '—' },
    { label: 'Employee ID',   value: p?.uid         || '—' },
  ],
  admin: (p) => [
    { label: 'Email',         value: p?.email },
    { label: 'Account',       value: 'Active ✓', green: true },
    { label: 'Member Since',  value: p?.created_at ? new Date(p.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—' },
    { label: 'Department',    value: p?.department  || '—' },
    { label: 'Phone',         value: p?.phone       || '—' },
  ],
};

/* ── Edit fields per role ── */
const EDIT_FIELDS = {
  student: [
    { key: 'name',       label: 'Full Name',         type: 'text', placeholder: 'Your full name',      required: true,  span: 2 },
    { key: 'department', label: 'Department',         type: 'text', placeholder: 'e.g. Engineering' },
    { key: 'phone',      label: 'Phone',              type: 'tel',  placeholder: '+91 98765 43210' },
    { key: 'branch',     label: 'Branch',             type: 'text', placeholder: 'e.g. CSE, ECE, ME' },
    { key: 'section',    label: 'Section',            type: 'text', placeholder: 'e.g. A, B, C' },
    { key: 'uid',        label: 'Roll / UID',         type: 'text', placeholder: 'e.g. 22CS001',        span: 2 },
    { key: 'bio',        label: 'Bio',                type: 'textarea', placeholder: 'Tell us a bit about yourself…', span: 2 },
  ],
  faculty: [
    { key: 'name',       label: 'Full Name',         type: 'text', placeholder: 'Your full name',      required: true,  span: 2 },
    { key: 'department', label: 'Department',         type: 'text', placeholder: 'e.g. Computer Science' },
    { key: 'phone',      label: 'Phone',              type: 'tel',  placeholder: '+91 98765 43210' },
    { key: 'uid',        label: 'Employee ID',        type: 'text', placeholder: 'e.g. FAC-2024-001',   span: 2 },
    { key: 'bio',        label: 'Research / Bio',     type: 'textarea', placeholder: 'Areas of research, interests…', span: 2 },
  ],
  admin: [
    { key: 'name',       label: 'Full Name',         type: 'text', placeholder: 'Your full name',      required: true,  span: 2 },
    { key: 'department', label: 'Department',         type: 'text', placeholder: 'e.g. Administration' },
    { key: 'phone',      label: 'Phone',              type: 'tel',  placeholder: '+91 98765 43210' },
    { key: 'bio',        label: 'Notes',              type: 'textarea', placeholder: 'Any admin notes…',              span: 2 },
  ],
};

const Profile = () => {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile'); // profile | security
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', department: '', phone: '', branch: '', section: '', uid: '', bio: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      setProfile(res.data);
      setEditForm({
        name:       res.data.name       || '',
        department: res.data.department || '',
        phone:      res.data.phone      || '',
        branch:     res.data.branch     || '',
        section:    res.data.section    || '',
        uid:        res.data.uid        || '',
        bio:        res.data.bio        || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await API.put('/profile/me/avatar', fd);
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      // Update user in AuthContext so navbar avatar updates too
      login({ ...user, avatar_url: res.data.avatar_url }, token);
      toast.success('Profile photo updated!');
    } catch { toast.error('Avatar upload failed'); }
    finally { setAvatarUploading(false); }
  };

  /* ── Edit profile ── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await API.put('/profile/me', editForm);
      setProfile(prev => ({ ...prev, ...res.data }));
      login({ ...user, name: res.data.name }, token);
      toast.success('Profile updated!');
      setEditMode(false);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await API.post('/profile/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <FullPageSpinner />;

  const homeRoute = user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student';

  const sidebarTop = [
    { icon: IconHome, label: 'Back',    onClick: () => navigate(homeRoute) },
    { icon: IconUser, label: 'Profile', active: activeSection === 'profile',  onClick: () => setActiveSection('profile') },
  ];

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Identity & Settings"
      sidebarTop={sidebarTop}
      sidebarBottom={[]}
      accentColor={BLUE}
    >
      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">Your Profile</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manage your EveSphere identity</p>
        </div>

        {/* ── Identity card ── */}
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft flex flex-col sm:flex-row gap-8 mb-6 animate-slide-up">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-[24px] overflow-hidden bg-gray-50 border-4 border-white shadow-soft flex items-center justify-center">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-5xl font-black font-display" style={{ color: BLUE }}>{profile?.name?.charAt(0)?.toUpperCase()}</span>
              }
              {avatarUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-[24px]">
                  <div className="w-6 h-6 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${BLUE}40`, borderTopColor: 'transparent', borderLeftColor: BLUE }} />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              title="Change photo"
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: BLUE }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1">
            {!editMode ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-4xl font-black text-gray-900 leading-none mb-2 font-display">{profile?.name}</h3>
                    <div className="flex flex-wrap gap-2">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${(ROLE_COLOR[user?.role] || ROLE_COLOR.admin).bg} ${(ROLE_COLOR[user?.role] || ROLE_COLOR.admin).text} ${(ROLE_COLOR[user?.role] || ROLE_COLOR.admin).border}`}>
                      {profile?.role}
                    </span>
                    {profile?.department && (
                      <span className="text-[9px] font-black px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-widest">
                        {profile.department}
                      </span>
                    )}
                    {user?.role === 'student' && profile?.branch && (
                      <span className="text-[9px] font-black px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-widest">
                        {profile.branch}{profile.section ? ` · ${profile.section}` : ''}
                      </span>
                    )}
                  </div>
                  </div>
                  <button onClick={() => setEditMode(true)}
                    className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex-shrink-0">
                    Edit Profile
                  </button>
                </div>
                {/* ── Role-aware info grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {(VIEW_FIELDS[user?.role] || VIEW_FIELDS.admin)(profile).map(({ label, value, green }) => (
                    <div key={label}>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className={`text-sm font-bold ${green ? 'text-green-500' : 'text-gray-800'}`}>{value}</p>
                    </div>
                  ))}
                  {profile?.bio && (
                    <div className="sm:col-span-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {user?.role === 'faculty' ? 'Research / Bio' : 'Bio'}
                      </p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-xl font-black font-display mb-4">
                  Edit {user?.role === 'student' ? 'Student' : user?.role === 'faculty' ? 'Faculty' : 'Admin'} Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(EDIT_FIELDS[user?.role] || EDIT_FIELDS.admin).map(({ key, label, type, placeholder, required, span }) => (
                    <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        {label}{required ? ' *' : ''}
                      </p>
                      {type === 'textarea' ? (
                        <textarea
                          rows={3}
                          className={`${IC} resize-none`}
                          value={editForm[key] || ''}
                          placeholder={placeholder}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      ) : (
                        <input
                          type={type}
                          className={IC}
                          value={editForm[key] || ''}
                          placeholder={placeholder}
                          required={!!required}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-60"
                    style={{ backgroundColor: BLUE }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)}
                    className="px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Security ── */}
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft animate-slide-up delay-100">
          <h3 className="text-2xl font-black font-display mb-6">Security Settings</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Current Password</p>
              <input type="password" placeholder="••••••••" className={IC} value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} required />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">New Password</p>
              <input type="password" placeholder="Min. 8 characters" className={IC} value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} required />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Confirm New Password</p>
              <input type="password" placeholder="••••••••" className={IC} value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} required />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-md mt-2 disabled:opacity-60"
              style={{ backgroundColor: BLUE }}>
              {saving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;