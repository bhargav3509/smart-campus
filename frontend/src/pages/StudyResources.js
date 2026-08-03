import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const PURPLE = '#7c4dff';
const RED    = '#ea4335';
const YELLOW = '#fbbc05';
const ACCENTS = [BLUE, GREEN, PURPLE, '#e040fb', '#00bcd4', RED, YELLOW];

const IC = 'w-full bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/[0.06] rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100';

/* ─── Icons ─── */
const IconBrowse    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconUpload    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconBookmark  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IconHistory   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconMyUploads = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconProfile   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

/* ─── File type helpers ─── */
const FILE_ICONS = {
  pdf:  { icon: '📄', color: '#ea4335', label: 'PDF' },
  doc:  { icon: '📝', color: '#1a73e8', label: 'DOC' },
  docx: { icon: '📝', color: '#1a73e8', label: 'DOCX' },
  ppt:  { icon: '📊', color: '#fbbc05', label: 'PPT' },
  pptx: { icon: '📊', color: '#fbbc05', label: 'PPTX' },
  zip:  { icon: '📦', color: '#7c4dff', label: 'ZIP' },
  jpg:  { icon: '🖼️', color: '#34a853', label: 'Image' },
  jpeg: { icon: '🖼️', color: '#34a853', label: 'Image' },
  png:  { icon: '🖼️', color: '#34a853', label: 'Image' },
  gif:  { icon: '🖼️', color: '#34a853', label: 'Image' },
  webp: { icon: '🖼️', color: '#34a853', label: 'Image' },
};
const getFileInfo = (type) => FILE_ICONS[type] || { icon: '📄', color: '#6b7280', label: type?.toUpperCase() || 'File' };

const formatSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/* ─── Star Rating ─── */
const StarRating = ({ rating = 0, size = 12, interactive = false, onChange }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type="button" disabled={!interactive}
        onClick={() => interactive && onChange?.(star)}
        className={`${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} transition-transform`}
        style={{ background: 'none', border: 'none', padding: 0 }}>
        <svg width={size} height={size} viewBox="0 0 24 24"
          fill={star <= rating ? '#fbbc05' : 'none'}
          stroke={star <= rating ? '#fbbc05' : '#d1d5db'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    ))}
  </div>
);

/* ─── Resource Card ─── */
const ResourceCard = ({ resource, idx, onBookmark, onDownload, onClick, isBookmarked }) => {
  const fi = getFileInfo(resource.file_type);
  const accent = ACCENTS[idx % ACCENTS.length];
  const delayMs = Math.min(idx * 50, 300);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#1a1a1f] rounded-[28px] overflow-hidden border border-gray-100 dark:border-white/[0.06] shadow-soft flex flex-col hover:-translate-y-1.5 hover:shadow-soft-lg transition-all duration-300 animate-slide-up cursor-pointer group"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Top accent bar */}
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}90)` }} />

      <div className="p-6 flex flex-col flex-1">
        {/* Category + Type badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {resource.category_name && (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-gray-50 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/[0.06]">
              {resource.category_icon} {resource.category_name}
            </span>
          )}
          {resource.file_type && (
            <span className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest text-white"
              style={{ backgroundColor: fi.color }}>
              {fi.label}
            </span>
          )}
          {resource.is_featured && (
            <span className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title + Description */}
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1.5 leading-tight font-display line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-medium leading-relaxed">{resource.description}</p>
        )}

        {/* Metadata */}
        <div className="space-y-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 mt-auto">
          {resource.faculty_name && (
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {resource.faculty_name}
            </div>
          )}
          {resource.department_name && (
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              {resource.department_name}{resource.semester ? ` · Sem ${resource.semester}` : ''}
            </div>
          )}
          {resource.subject_name && (
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {resource.subject_name}
            </div>
          )}
        </div>

        {/* Footer: Rating + Downloads + Actions */}
        <div className="pt-4 border-t border-gray-50 dark:border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StarRating rating={Math.round(resource.avg_rating || 0)} size={10} />
            <span className="text-[9px] font-bold text-gray-400">
              {resource.avg_rating > 0 ? parseFloat(resource.avg_rating).toFixed(1) : '–'}
            </span>
            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {resource.download_count || 0}
            </span>
            {resource.file_size > 0 && (
              <span className="text-[9px] font-bold text-gray-300">{formatSize(resource.file_size)}</span>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => onBookmark?.(resource.id)} title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked ? BLUE : 'none'} stroke={isBookmarked ? BLUE : 'currentColor'} strokeWidth="2.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            {resource.file_url && (
              <button onClick={() => onDownload?.(resource)} title="Download"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ Resource form (shared between upload and edit) ═══ */
const ResourceForm = ({ form, setForm, onSubmit, submitLabel, onCancel, isEdit = false, categories, departments, subjects, uploading }) => (
  <div className={`mb-8 bg-white dark:bg-[#1a1a1f] rounded-[32px] p-8 border ${isEdit ? 'border-green-100/50 dark:border-green-500/20' : 'border-blue-100/50 dark:border-blue-500/20'} shadow-soft animate-slide-up`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-black font-display text-gray-900 dark:text-white">{isEdit ? 'Edit Resource' : 'Upload New Resource'}</h3>
      <button onClick={onCancel} type="button" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <input type="text" placeholder="Resource Title *" className={IC} required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
      <select className={IC} value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
        <option value="">Select Category</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </select>
      <textarea placeholder="Description" rows={3} className={`${IC} md:col-span-2 h-24 resize-none`} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
      <select className={IC} value={form.department_id} onChange={e => setForm(f => ({...f, department_id: e.target.value, subject_id: ''}))}>
        <option value="">Select Department</option>
        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className={IC} value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value, subject_id: ''}))}>
        <option value="">Select Semester</option>
        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>
      <select className={IC} value={form.subject_id} onChange={e => setForm(f => ({...f, subject_id: e.target.value}))}>
        <option value="">Select Subject</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
      </select>
      <input type="text" placeholder="Resource Type (e.g. Notes, Lab Manual)" className={IC} value={form.resource_type} onChange={e => setForm(f => ({...f, resource_type: e.target.value}))} />
      <input type="text" placeholder="Tags (comma separated)" className={`${IC} md:col-span-2`} value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} />
      <input type="url" placeholder="External Link (YouTube, Google Drive, etc.)" className={`${IC} md:col-span-2`} value={form.external_url} onChange={e => setForm(f => ({...f, external_url: e.target.value}))} />
      <div className="md:col-span-2 bg-gray-50 dark:bg-[#111114] border border-dashed border-gray-200 dark:border-white/[0.10] rounded-2xl p-5 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
          {isEdit ? 'Replace File (Optional)' : 'Upload File (PDF, DOC, PPT, ZIP, Image — max 50MB)'}
        </p>
        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.gif,.webp" className="text-xs"
          onChange={e => setForm(f => ({...f, file: e.target.files[0]}))} />
      </div>
      <div className="md:col-span-2 flex gap-3 pt-2">
        <button type="submit" disabled={uploading}
          className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50 active:scale-95 transition-all"
          style={{ backgroundColor: isEdit ? GREEN : BLUE }}>
          {uploading ? 'Uploading…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const StudyResources = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';
  const isAdmin   = user?.role === 'admin';
  const searchTimeout = useRef(null);

  const [activeTab, setActiveTab] = useState('browse');
  const [resources, setResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', department_id: '', semester: '', subject_id: '',
    category_id: '', tags: '', resource_type: '', external_url: '', file: null,
  });

  // Edit form
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ── Fetch master data ──
  const fetchMasterData = useCallback(async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        API.get('/departments'),
        API.get('/resource-categories'),
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
    } catch { /* silent */ }
  }, []);

  // ── Fetch subjects (when dept/sem changes) ──
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const params = {};
        if (filterDept) params.department_id = filterDept;
        if (filterSem) params.semester = filterSem;
        const res = await API.get('/subjects', { params });
        setSubjects(res.data);
      } catch { setSubjects([]); }
    };
    fetchSubjects();
  }, [filterDept, filterSem]);

  // ── Fetch subjects for upload form ──
  const [uploadSubjects, setUploadSubjects] = useState([]);
  useEffect(() => {
    const fetchUploadSubjects = async () => {
      try {
        const params = {};
        if (uploadForm.department_id) params.department_id = uploadForm.department_id;
        if (uploadForm.semester) params.semester = uploadForm.semester;
        const res = await API.get('/subjects', { params });
        setUploadSubjects(res.data);
      } catch { setUploadSubjects([]); }
    };
    if (uploadForm.department_id || uploadForm.semester) fetchUploadSubjects();
    else setUploadSubjects([]);
  }, [uploadForm.department_id, uploadForm.semester]);

  // ── Fetch resources ──
  const fetchResources = useCallback(async () => {
    try {
      const params = { sort: sortBy };
      if (search) params.search = search;
      if (filterDept) params.department_id = filterDept;
      if (filterSem) params.semester = filterSem;
      if (filterSubject) params.subject_id = filterSubject;
      if (filterCategory) params.category_id = filterCategory;
      if (filterType) params.file_type = filterType;
      const res = await API.get('/resources', { params });
      setResources(res.data);
    } catch { toast.error('Failed to load resources'); }
  }, [search, filterDept, filterSem, filterSubject, filterCategory, filterType, sortBy]);

  // ── Fetch based on active tab ──
  const fetchTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        await fetchResources();
      } else if (activeTab === 'my-uploads') {
        const res = await API.get('/resources/my');
        setMyResources(res.data);
      } else if (activeTab === 'bookmarks') {
        const res = await API.get('/resources/bookmarks');
        setBookmarks(res.data);
        setBookmarkedIds(new Set(res.data.map(r => r.id)));
      } else if (activeTab === 'history') {
        const res = await API.get('/resources/downloads/history');
        setDownloadHistory(res.data);
      }
    } catch { /* handled in individual fetchers */ }
    finally { setLoading(false); }
  }, [activeTab, fetchResources]);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);
  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  // ── Fetch bookmarked IDs for browse tab ──
  useEffect(() => {
    if (activeTab === 'browse' && isStudent) {
      API.get('/resources/bookmarks').then(res => {
        setBookmarkedIds(new Set(res.data.map(r => r.id)));
      }).catch(() => {});
    }
  }, [activeTab, isStudent]);

  // ── Debounced search ──
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchResources();
    }, 400);
  };

  // ── Actions ──
  const handleBookmark = async (id) => {
    try {
      const res = await API.post(`/resources/${id}/bookmark`);
      if (res.data.bookmarked) {
        setBookmarkedIds(prev => new Set([...prev, id]));
        toast.success('Bookmarked!');
      } else {
        setBookmarkedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        toast.success('Bookmark removed');
      }
      if (activeTab === 'bookmarks') fetchTabData();
    } catch { toast.error('Failed to toggle bookmark'); }
  };

  const handleDownload = async (resource) => {
    try {
      const res = await API.post(`/resources/${resource.id}/download`);
      if (res.data.file_url) {
        window.open(res.data.file_url, '_blank');
        toast.success('Download started!');
      }
    } catch { toast.error('Download failed'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title) return toast.error('Title is required');
    if (!uploadForm.file && !uploadForm.external_url) return toast.error('Upload a file or add an external link');

    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(uploadForm).forEach(([k, v]) => {
        if (v != null && v !== '') {
          if (k === 'file') fd.append('file', v);
          else fd.append(k, v);
        }
      });
      await API.post('/resources', fd);
      toast.success('Resource uploaded successfully!');
      setShowUploadForm(false);
      setUploadForm({ title: '', description: '', department_id: '', semester: '', subject_id: '', category_id: '', tags: '', resource_type: '', external_url: '', file: null });
      fetchTabData();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await API.delete(`/resources/${id}`);
      toast.success('Resource deleted');
      fetchTabData();
    } catch { toast.error('Delete failed'); }
  };

  const handleEditResource = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => {
        if (v != null && v !== '' && k !== 'id') {
          if (k === 'file') fd.append('file', v);
          else fd.append(k, v);
        }
      });
      await API.put(`/resources/${editForm.id}`, fd);
      toast.success('Resource updated!');
      setEditingResource(null);
      fetchTabData();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const startEdit = (resource) => {
    setEditingResource(resource.id);
    setEditForm({
      id: resource.id,
      title: resource.title || '',
      description: resource.description || '',
      department_id: resource.department_id || '',
      semester: resource.semester || '',
      subject_id: resource.subject_id || '',
      category_id: resource.category_id || '',
      tags: (resource.tags || []).join(', '),
      resource_type: resource.resource_type || '',
      external_url: resource.external_url || '',
      file: null,
    });
  };

  if (loading && resources.length === 0 && myResources.length === 0) return <FullPageSpinner />;

  // ── Sidebar ──
  const sidebarTop = [
    { icon: IconBrowse, label: 'Browse', active: activeTab === 'browse', onClick: () => setActiveTab('browse') },
  ];
  if (isFaculty) {
    sidebarTop.push({ icon: IconMyUploads, label: 'My Uploads', active: activeTab === 'my-uploads', onClick: () => setActiveTab('my-uploads') });
  }
  if (isStudent) {
    sidebarTop.push({ icon: IconBookmark, label: 'Bookmarks', active: activeTab === 'bookmarks', onClick: () => setActiveTab('bookmarks') });
    sidebarTop.push({ icon: IconHistory, label: 'History', active: activeTab === 'history', onClick: () => setActiveTab('history') });
  }

  const sidebarBottom = [
    { icon: IconProfile, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const homeRoute = user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student';

  // ── Header actions ──
  const headerActions = (
    <div className="flex items-center gap-3">
      {activeTab === 'browse' && (
        <div className="relative hidden md:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search resources…"
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/[0.06] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52 text-gray-900 dark:text-gray-100" />
        </div>
      )}
      {isFaculty && (
        <button onClick={() => { setShowUploadForm(v => !v); }}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: BLUE }}>
          + Upload Resource
        </button>
      )}
      <button onClick={() => navigate(homeRoute)}
        className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
        ← Dashboard
      </button>
    </div>
  );

  // ── Tab titles ──
  const tabTitles = {
    'browse': 'Study Resources',
    'my-uploads': 'My Uploads',
    'bookmarks': 'Bookmarked Resources',
    'history': 'Download History',
  };
  const tabSubtitles = {
    'browse': 'Discover learning materials uploaded by faculty',
    'my-uploads': `${myResources.length} resource${myResources.length !== 1 ? 's' : ''} uploaded`,
    'bookmarks': `${bookmarks.length} saved resource${bookmarks.length !== 1 ? 's' : ''}`,
    'history': 'Your recently downloaded resources',
  };



  return (
    <DashboardLayout
      title="StudySphere"
      subtitle="Learning Resources"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor={PURPLE}
    >
      <div className="px-8 py-8">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-none mb-1 font-display">
            {tabTitles[activeTab]}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {tabSubtitles[activeTab]}
          </p>
        </div>

        {/* ── Upload form ── */}
        {showUploadForm && (
          <ResourceForm
            form={uploadForm}
            setForm={setUploadForm}
            onSubmit={handleUpload}
            submitLabel="Upload Resource"
            onCancel={() => setShowUploadForm(false)}
            categories={categories}
            departments={departments}
            subjects={uploadSubjects}
            uploading={uploading}
          />
        )}

        {/* ── Filters (browse tab only) ── */}
        {activeTab === 'browse' && (
          <div className="mb-6 flex flex-wrap gap-3 animate-fade-in">
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterSubject(''); }}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={filterSem} onChange={e => { setFilterSem(e.target.value); setFilterSubject(''); }}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            {subjects.length > 0 && (
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="docx">DOCX</option>
              <option value="ppt">PPT</option>
              <option value="pptx">PPTX</option>
              <option value="zip">ZIP</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-white/[0.06] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="rating">Highest Rated</option>
              <option value="title">By Title</option>
            </select>
            {(filterDept || filterSem || filterSubject || filterCategory || filterType || search) && (
              <button onClick={() => { setFilterDept(''); setFilterSem(''); setFilterSubject(''); setFilterCategory(''); setFilterType(''); setSearch(''); }}
                className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ── Browse grid ── */}
        {activeTab === 'browse' && (
          resources.length === 0
            ? <EmptyState
                title="No Resources Found"
                description={search ? 'Try different search terms or clear filters' : 'Resources will appear here once uploaded'}
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {resources.map((r, idx) => (
                  <ResourceCard
                    key={r.id} resource={r} idx={idx}
                    isBookmarked={bookmarkedIds.has(r.id)}
                    onBookmark={handleBookmark}
                    onDownload={handleDownload}
                    onClick={() => navigate(`/resources/${r.id}`)}
                  />
                ))}
              </div>
        )}

        {/* ── My Uploads ── */}
        {activeTab === 'my-uploads' && (
          myResources.length === 0
            ? <EmptyState
                title="No Uploads Yet"
                description="Upload your first learning resource using the button above"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                action={
                  <button onClick={() => setShowUploadForm(true)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: BLUE }}>
                    Upload Resource
                  </button>
                }
              />
            : <div className="space-y-4">
                {myResources.map((r, idx) => (
                  editingResource === r.id ? (
                    <ResourceForm key={r.id} form={editForm} setForm={setEditForm}
                      onSubmit={handleEditResource} submitLabel="Save Changes"
                      onCancel={() => setEditingResource(null)} isEdit
                      categories={categories} departments={departments} subjects={subjects} uploading={uploading}
                    />
                  ) : (
                    <div key={r.id} className="bg-white dark:bg-[#1a1a1f] rounded-[24px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-slide-up"
                      style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/resources/${r.id}`)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-gray-900 dark:text-white font-display truncate">{r.title}</h3>
                          {r.status === 'archived' && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Archived</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {r.category_name && <span>{r.category_icon} {r.category_name}</span>}
                          {r.department_name && <span>🏛 {r.department_name}</span>}
                          {r.semester && <span>📅 Sem {r.semester}</span>}
                          <span>⬇ {r.download_count || 0} downloads</span>
                          <span>⭐ {r.avg_rating > 0 ? parseFloat(r.avg_rating).toFixed(1) : '–'}</span>
                          {r.file_size > 0 && <span>📎 {formatSize(r.file_size)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(r)}
                          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
                          style={{ backgroundColor: BLUE }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteResource(r.id)}
                          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
        )}

        {/* ── Bookmarks ── */}
        {activeTab === 'bookmarks' && (
          bookmarks.length === 0
            ? <EmptyState
                title="No Bookmarks Yet"
                description="Bookmark resources you want to access later"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
                action={
                  <button onClick={() => setActiveTab('browse')}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: PURPLE }}>
                    Browse Resources
                  </button>
                }
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bookmarks.map((r, idx) => (
                  <ResourceCard
                    key={r.id} resource={r} idx={idx}
                    isBookmarked={true}
                    onBookmark={handleBookmark}
                    onDownload={handleDownload}
                    onClick={() => navigate(`/resources/${r.id}`)}
                  />
                ))}
              </div>
        )}

        {/* ── Download History ── */}
        {activeTab === 'history' && (
          downloadHistory.length === 0
            ? <EmptyState
                title="No Downloads Yet"
                description="Resources you download will appear here"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                action={
                  <button onClick={() => setActiveTab('browse')}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: PURPLE }}>
                    Browse Resources
                  </button>
                }
              />
            : <div className="space-y-4">
                {downloadHistory.map((r, idx) => (
                  <div key={`${r.id}-${r.downloaded_at}`}
                    className="bg-white dark:bg-[#1a1a1f] rounded-[24px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up cursor-pointer hover:shadow-soft-lg transition-all"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                    onClick={() => navigate(`/resources/${r.id}`)}>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white font-display truncate">{r.title}</h3>
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {r.faculty_name && <span>👤 {r.faculty_name}</span>}
                        {r.department_name && <span>🏛 {r.department_name}</span>}
                        <span>📅 {new Date(r.downloaded_at).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(r); }}
                      className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all flex-shrink-0"
                      style={{ backgroundColor: BLUE }}>
                      ↓ Download Again
                    </button>
                  </div>
                ))}
              </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudyResources;
