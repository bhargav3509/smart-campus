import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const RED = '#ea4335';

// SVG Icons
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

const Profile = () => {
  const { user, login, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      setProfile(res.data);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.from('.profile-card', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.3 });
      }, container);
      return () => ctx.revert();
    }
  }, [loading]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent transparent transparent` }} />
    </div>
  );

  return (
    <div ref={container} className="min-h-screen bg-[#f8f9fc] flex font-sans antialiased text-gray-900">
      
      {/* Sidebar */}
      <aside className="sidebar w-20 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-50 sticky top-0 h-screen">
        <div className="mb-12">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Home" onClick={() => navigate(-1)} />
          <SidebarItem icon={IconUser} label="Profile" active />
          <SidebarItem icon={IconSettings} label="Account" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Identity Console</h1>
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated: {user?.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => logout()} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline transition-all">Sign Out</button>
          </div>
        </header>

        {/* Profile Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10 max-w-4xl">
          
          <div className="mb-12">
            <h2 className="text-6xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
              Your Profile
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Manage your EveSphere identity</p>
          </div>

          <div className="profile-card bg-white rounded-[40px] p-12 shadow-soft border border-gray-100/50 flex flex-col items-center sm:items-start sm:flex-row gap-12 mb-12">
             <div className="relative group">
                <div className="w-48 h-48 rounded-[32px] bg-gray-50 overflow-hidden border-4 border-white shadow-inner flex items-center justify-center">
                   {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="text-7xl font-black text-blue-600 uppercase" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{profile?.name?.charAt(0)}</div>}
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
             </div>
             <div className="flex-1 text-center sm:text-left">
                <h3 className="text-5xl font-black text-gray-900 leading-none mb-4" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{profile?.name}</h3>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-8">
                   <span className="text-[10px] font-black px-4 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">{profile?.role}</span>
                   <span className="text-[10px] font-black px-4 py-1.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 uppercase tracking-widest">{profile?.department || 'General'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                      <p className="font-bold text-gray-800">{profile?.email}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Status</p>
                      <p className="font-bold text-green-500 uppercase text-xs">Verified</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
                      <p className="font-bold text-gray-800">{new Date(profile?.created_at).toLocaleDateString([], {month:'long', year:'numeric'})}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="profile-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h4 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Security Settings</h4>
                <div className="space-y-4">
                   <button className="w-full bg-gray-50 text-gray-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Change Password</button>
                   <button className="w-full bg-gray-50 text-gray-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Two-Factor Auth</button>
                </div>
             </div>
             <div className="profile-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h4 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Danger Zone</h4>
                <div className="space-y-4">
                   <button className="w-full bg-red-50 text-red-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Deactivate Account</button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;