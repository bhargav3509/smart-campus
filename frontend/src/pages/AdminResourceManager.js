import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const RED    = '#ea4335';
const PURPLE = '#7c4dff';

const IC = 'w-full bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/[0.06] rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100';

/* ─── Icons ─── */
const IconResources  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconDepts      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconSubjects   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconCategories = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconStats      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

/* ─── FormCard ─── */
const FormCard = ({ title, onClose, children }) => (
  <div className="mb-6 bg-white dark:bg-[#1a1a1f] rounded-[32px] p-8 border border-blue-100/50 dark:border-blue-500/20 shadow-soft animate-slide-up">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-black font-display text-gray-900 dark:text-white">{title}</h3>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    {children}
  </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon, color, delay = 0 }) => (
  <div className="bg-white dark:bg-[#1a1a1f] rounded-[24px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
        {icon}
      </div>
    </div>
    <p className="text-4xl font-black text-gray-900 dark:text-white font-display">{value}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ADMIN RESOURCE MANAGER
   ═══════════════════════════════════════════════════════════ */
const AdminResourceManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);

  // Data
  const [resources, setResources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');

  // Forms
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', department_id: '', semester: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📄' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, deptData, subData, catData, statsData] = await Promise.all([
        API.get('/resources', { params: { limit: 100 } }),
        API.get('/departments'),
        API.get('/subjects'),
        API.get('/resource-categories'),
        API.get('/resources/stats'),
      ]);
      setResources(resData.data);
      setDepartments(deptData.data);
      setSubjects(subData.data);
      setCategories(catData.data);
      setStats(statsData.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Resource actions ──
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try { await API.delete(`/resources/${id}`); toast.success('Resource deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  const handleToggleFeatured = async (id) => {
    try { await API.put(`/resources/${id}/feature`); toast.success('Featured status toggled'); fetchData(); }
    catch { toast.error('Failed to toggle featured'); }
  };

  // ── Department CRUD ──
  const handleCreateDept = async (e) => {
    e.preventDefault();
    try { await API.post('/departments', deptForm); toast.success('Department added!'); setShowDeptForm(false); setDeptForm({ name: '', code: '' }); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department? This will affect linked resources and subjects.')) return;
    try { await API.delete(`/departments/${id}`); toast.success('Department deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  // ── Subject CRUD ──
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try { await API.post('/subjects', subjectForm); toast.success('Subject added!'); setShowSubjectForm(false); setSubjectForm({ name: '', code: '', department_id: '', semester: '' }); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await API.delete(`/subjects/${id}`); toast.success('Subject deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  // ── Category CRUD ──
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try { await API.post('/resource-categories', categoryForm); toast.success('Category added!'); setShowCategoryForm(false); setCategoryForm({ name: '', icon: '📄' }); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await API.delete(`/resource-categories/${id}`); toast.success('Category deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <FullPageSpinner />;

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.faculty_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const sidebarTop = [
    { icon: IconResources,  label: 'Resources',  active: activeTab === 'resources',  onClick: () => setActiveTab('resources') },
    { icon: IconDepts,      label: 'Depts',       active: activeTab === 'departments', onClick: () => setActiveTab('departments') },
    { icon: IconSubjects,   label: 'Subjects',   active: activeTab === 'subjects',   onClick: () => setActiveTab('subjects') },
    { icon: IconCategories, label: 'Categories', active: activeTab === 'categories', onClick: () => setActiveTab('categories') },
    { icon: IconStats,      label: 'Stats',      active: activeTab === 'stats',      onClick: () => setActiveTab('stats') },
  ];
  const sidebarBottom = [];

  const headerActions = (
    <div className="flex items-center gap-3">
      {activeTab === 'resources' && (
        <div className="relative hidden md:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/[0.06] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44 text-gray-900 dark:text-gray-100" />
        </div>
      )}
      {activeTab === 'departments' && (
        <button onClick={() => setShowDeptForm(v => !v)}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all" style={{ backgroundColor: GREEN }}>
          + Add Department
        </button>
      )}
      {activeTab === 'subjects' && (
        <button onClick={() => setShowSubjectForm(v => !v)}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all" style={{ backgroundColor: BLUE }}>
          + Add Subject
        </button>
      )}
      {activeTab === 'categories' && (
        <button onClick={() => setShowCategoryForm(v => !v)}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all" style={{ backgroundColor: PURPLE }}>
          + Add Category
        </button>
      )}
      <button onClick={() => navigate('/admin')}
        className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
        ← Admin Console
      </button>
    </div>
  );

  const tabTitles = {
    resources: 'Resource Oversight',
    departments: 'Department Management',
    subjects: 'Subject Catalog',
    categories: 'Resource Categories',
    stats: 'Analytics & Insights',
  };

  return (
    <DashboardLayout
      title="Admin Console"
      subtitle="Study Resources"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor="#0f0f11"
    >
      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-none mb-1 font-display">{tabTitles[activeTab]}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Administrative resource management</p>
        </div>

        {/* ═══ Resources Tab ═══ */}
        {activeTab === 'resources' && (
          filteredResources.length === 0
            ? <EmptyState title="No Resources" description="No resources found"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>} />
            : <div className="space-y-3">
                {filteredResources.map((r, idx) => (
                  <div key={r.id} className="bg-white dark:bg-[#1a1a1f] rounded-[24px] p-5 border border-gray-100 dark:border-white/[0.06] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/resources/${r.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white font-display truncate">{r.title}</h3>
                        {r.is_featured && <span className="text-[8px] font-black px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">⭐ FEATURED</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {r.faculty_name && <span>👤 {r.faculty_name}</span>}
                        {r.department_name && <span>🏛 {r.department_name}</span>}
                        {r.category_name && <span>{r.category_icon} {r.category_name}</span>}
                        <span>⬇ {r.download_count || 0}</span>
                        <span>⭐ {r.avg_rating > 0 ? parseFloat(r.avg_rating).toFixed(1) : '–'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleToggleFeatured(r.id)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${
                          r.is_featured ? 'text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-400' : 'text-gray-500 bg-gray-100 dark:bg-white/[0.05] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
                        }`}>
                        {r.is_featured ? '★ Unfeature' : '☆ Feature'}
                      </button>
                      <button onClick={() => handleDeleteResource(r.id)}
                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ═══ Departments Tab ═══ */}
        {activeTab === 'departments' && (
          <>
            {showDeptForm && (
              <FormCard title="Add Department" onClose={() => setShowDeptForm(false)}>
                <form onSubmit={handleCreateDept} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Department Name *" className={IC} required value={deptForm.name} onChange={e => setDeptForm(f => ({...f, name: e.target.value}))} />
                  <input type="text" placeholder="Code (e.g. CSE) *" className={IC} required value={deptForm.code} onChange={e => setDeptForm(f => ({...f, code: e.target.value}))} />
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: GREEN }}>Add Department</button>
                    <button type="button" onClick={() => setShowDeptForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">Cancel</button>
                  </div>
                </form>
              </FormCard>
            )}
            {departments.length === 0
              ? <EmptyState title="No Departments" description="Add your first department" icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} />
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((d, idx) => (
                    <div key={d.id} className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                      <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-4 text-green-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 font-display">{d.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Code: {d.code}</p>
                      <div className="pt-4 border-t border-gray-50 dark:border-white/[0.04] flex items-center justify-between">
                        <span className="text-[9px] font-black text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                        <button onClick={() => handleDeleteDept(d.id)} className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </>
        )}

        {/* ═══ Subjects Tab ═══ */}
        {activeTab === 'subjects' && (
          <>
            {showSubjectForm && (
              <FormCard title="Add Subject" onClose={() => setShowSubjectForm(false)}>
                <form onSubmit={handleCreateSubject} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Subject Name *" className={IC} required value={subjectForm.name} onChange={e => setSubjectForm(f => ({...f, name: e.target.value}))} />
                  <input type="text" placeholder="Subject Code (e.g. CS101) *" className={IC} required value={subjectForm.code} onChange={e => setSubjectForm(f => ({...f, code: e.target.value}))} />
                  <select className={IC} required value={subjectForm.department_id} onChange={e => setSubjectForm(f => ({...f, department_id: e.target.value}))}>
                    <option value="">Select Department *</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select className={IC} required value={subjectForm.semester} onChange={e => setSubjectForm(f => ({...f, semester: e.target.value}))}>
                    <option value="">Select Semester *</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: BLUE }}>Add Subject</button>
                    <button type="button" onClick={() => setShowSubjectForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">Cancel</button>
                  </div>
                </form>
              </FormCard>
            )}
            {subjects.length === 0
              ? <EmptyState title="No Subjects" description="Add your first subject" icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>} />
              : <div className="space-y-3">
                  {subjects.map((s, idx) => (
                    <div key={s.id} className="bg-white dark:bg-[#1a1a1f] rounded-[24px] p-5 border border-gray-100 dark:border-white/[0.06] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up"
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white font-display">{s.name}</h3>
                        <div className="flex flex-wrap gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          <span>📋 {s.code}</span>
                          {s.department_name && <span>🏛 {s.department_name}</span>}
                          <span>📅 Semester {s.semester}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSubject(s.id)}
                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex-shrink-0">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
            }
          </>
        )}

        {/* ═══ Categories Tab ═══ */}
        {activeTab === 'categories' && (
          <>
            {showCategoryForm && (
              <FormCard title="Add Category" onClose={() => setShowCategoryForm(false)}>
                <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Category Name *" className={IC} required value={categoryForm.name} onChange={e => setCategoryForm(f => ({...f, name: e.target.value}))} />
                  <input type="text" placeholder="Icon Emoji (e.g. 📄)" className={IC} value={categoryForm.icon} onChange={e => setCategoryForm(f => ({...f, icon: e.target.value}))} />
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: PURPLE }}>Add Category</button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">Cancel</button>
                  </div>
                </form>
              </FormCard>
            )}
            {categories.length === 0
              ? <EmptyState title="No Categories" description="Add your first category" icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>} />
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((c, idx) => (
                    <div key={c.id} className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}>
                      <div className="text-3xl mb-3">{c.icon}</div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 font-display">{c.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">{c.slug}</p>
                      <div className="pt-3 border-t border-gray-50 dark:border-white/[0.04] flex justify-end">
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </>
        )}

        {/* ═══ Stats Tab ═══ */}
        {activeTab === 'stats' && stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Total Resources" value={stats.total_resources} color={BLUE} delay={0}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>} />
              <StatCard label="This Month" value={stats.this_month} color={GREEN} delay={50}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
              <StatCard label="Departments" value={departments.length} color={PURPLE} delay={100}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} />
              <StatCard label="Categories" value={categories.length} color={RED} delay={150}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>} />
            </div>

            {/* Download chart */}
            {stats.download_stats?.length > 0 && (
              <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Downloads — Last 30 Days</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.download_stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip labelFormatter={d => new Date(d).toLocaleDateString([], { dateStyle: 'medium' })} />
                    <Bar dataKey="count" fill={BLUE} radius={[6, 6, 0, 0]} name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top downloaded + Top rated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats.top_downloaded?.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '250ms' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Most Downloaded</p>
                  <div className="space-y-3">
                    {stats.top_downloaded.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-300 w-5">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                            <p className="text-[9px] font-bold text-gray-400">{r.faculty_name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-600 flex-shrink-0">{r.download_count} ⬇</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.top_rated?.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Highest Rated</p>
                  <div className="space-y-3">
                    {stats.top_rated.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-300 w-5">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                            <p className="text-[9px] font-bold text-gray-400">{r.faculty_name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-yellow-600 flex-shrink-0">⭐ {parseFloat(r.avg_rating).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminResourceManager;
