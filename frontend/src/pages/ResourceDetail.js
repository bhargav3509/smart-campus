import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FullPageSpinner } from '../components/ui/Spinner';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const PURPLE = '#7c4dff';
const RED    = '#ea4335';

const IC = 'w-full bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/[0.06] rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100';

/* ─── Icons ─── */
const IconBack      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconProfile   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const formatSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/* ─── YouTube embed helper ─── */
const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

/* ─── Star Rating ─── */
const StarRating = ({ rating = 0, size = 16, interactive = false, onChange }) => (
  <div className="flex items-center gap-1">
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

/* ═══════════════════════════════════════════════════════════
   RESOURCE DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */
const ResourceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const isAdmin   = user?.role === 'admin';

  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchResource = useCallback(async () => {
    try {
      const [resData, commData] = await Promise.all([
        API.get(`/resources/${id}`),
        API.get(`/resources/${id}/comments`),
      ]);
      setResource(resData.data);
      setComments(commData.data);
    } catch (err) {
      toast.error('Resource not found');
      navigate('/resources');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchResource(); }, [fetchResource]);

  const handleDownload = async () => {
    try {
      const res = await API.post(`/resources/${id}/download`);
      if (res.data.file_url) {
        window.open(res.data.file_url, '_blank');
        toast.success('Download started!');
        setResource(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
      }
    } catch { toast.error('Download failed'); }
  };

  const handleBookmark = async () => {
    try {
      const res = await API.post(`/resources/${id}/bookmark`);
      setResource(prev => ({ ...prev, is_bookmarked: res.data.bookmarked }));
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Bookmark removed');
    } catch { toast.error('Failed to toggle bookmark'); }
  };

  const handleRate = async (rating) => {
    try {
      const res = await API.post(`/resources/${id}/rate`, { rating });
      setResource(prev => ({ ...prev, user_rating: res.data.rating, avg_rating: res.data.avg_rating }));
      toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''}!`);
    } catch { toast.error('Rating failed'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await API.post(`/resources/${id}/comments`, { content: newComment.trim() });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await API.delete(`/resources/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleHideComment = async (commentId) => {
    try {
      await API.put(`/resources/comments/${commentId}/hide`);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_hidden: !c.is_hidden } : c));
      toast.success('Comment visibility toggled');
    } catch { toast.error('Failed to update comment'); }
  };

  if (loading) return <FullPageSpinner />;
  if (!resource) return null;

  const ytId = getYouTubeId(resource.external_url);
  const isPdf = resource.file_type === 'pdf';

  const sidebarTop = [
    { icon: IconBack, label: 'Back', onClick: () => navigate('/resources') },
  ];
  const sidebarBottom = [
    { icon: IconProfile, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  return (
    <DashboardLayout
      title="StudySphere"
      subtitle={resource.title}
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      accentColor={PURPLE}
      headerActions={
        <button onClick={() => navigate('/resources')}
          className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
          ← All Resources
        </button>
      }
    >
      <div className="px-8 py-8 max-w-6xl">
        {/* ── Header ── */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {resource.category_name && (
              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-gray-50 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/[0.06]">
                {resource.category_icon} {resource.category_name}
              </span>
            )}
            {resource.file_type && (
              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest text-white"
                style={{ backgroundColor: resource.file_type === 'pdf' ? RED : resource.file_type?.includes('ppt') ? '#fbbc05' : BLUE }}>
                {resource.file_type?.toUpperCase()}
              </span>
            )}
            {resource.is_featured && (
              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">⭐ Featured</span>
            )}
          </div>
          <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-none mb-2 font-display">{resource.title}</h2>
          {resource.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-3xl mb-4">{resource.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* PDF Preview */}
            {isPdf && resource.file_url && (
              <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] overflow-hidden border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up">
                <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">PDF Preview</p>
                </div>
                <iframe src={resource.file_url} title="PDF Preview" className="w-full border-0" style={{ height: '600px' }} />
              </div>
            )}

            {/* YouTube Embed */}
            {ytId && (
              <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] overflow-hidden border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up">
                <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Video</p>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="YouTube video"
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                {resource.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Comments Section ── */}
            <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '150ms' }}>
              <h3 className="text-2xl font-black font-display text-gray-900 dark:text-white mb-6">
                Comments
                <span className="text-sm font-bold text-gray-400 ml-2">({comments.length})</span>
              </h3>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ backgroundColor: PURPLE }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment…"
                      rows={2}
                      className={`${IC} resize-none`} />
                    <div className="flex justify-end mt-2">
                      <button type="submit" disabled={!newComment.trim() || submittingComment}
                        className="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50 active:scale-95 transition-all"
                        style={{ backgroundColor: BLUE }}>
                        {submittingComment ? 'Posting…' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id}
                      className={`flex gap-3 ${comment.is_hidden ? 'opacity-40' : ''}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ backgroundColor: BLUE }}>
                        {comment.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-800 dark:text-gray-200">{comment.user_name}</span>
                          <span className="text-[9px] font-bold text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                          </span>
                          {comment.is_hidden && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">Hidden</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                        {/* Actions */}
                        <div className="flex gap-3 mt-1">
                          {(comment.user_id === user?.id || isAdmin) && (
                            <button onClick={() => handleDeleteComment(comment.id)}
                              className="text-[9px] font-bold text-red-500 hover:text-red-600 transition-colors">
                              Delete
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleHideComment(comment.id)}
                              className="text-[9px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
                              {comment.is_hidden ? 'Unhide' : 'Hide'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar Info ── */}
          <div className="space-y-6">
            {/* Actions card */}
            <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="space-y-3">
                {resource.file_url && (
                  <button onClick={handleDownload}
                    className="w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: BLUE }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download File
                  </button>
                )}
                {resource.external_url && !ytId && (
                  <a href={resource.external_url} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: GREEN, display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Open External Link
                  </a>
                )}
                {resource.external_url && ytId && (
                  <a href={resource.external_url} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                    style={{ display: 'flex' }}>
                    Open in YouTube
                  </a>
                )}
                <button onClick={handleBookmark}
                  className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    resource.is_bookmarked
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20'
                      : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
                  }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={resource.is_bookmarked ? BLUE : 'none'} stroke={resource.is_bookmarked ? BLUE : 'currentColor'} strokeWidth="2.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {resource.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            </div>

            {/* Rating card */}
            <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '100ms' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Rating</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-black text-gray-900 dark:text-white font-display">
                  {resource.avg_rating > 0 ? parseFloat(resource.avg_rating).toFixed(1) : '–'}
                </span>
                <div>
                  <StarRating rating={Math.round(resource.avg_rating || 0)} size={14} />
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">{resource.download_count || 0} downloads</p>
                </div>
              </div>
              {isStudent && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Your Rating</p>
                  <StarRating rating={resource.user_rating || 0} size={20} interactive onChange={handleRate} />
                </div>
              )}
            </div>

            {/* Metadata card */}
            <div className="bg-white dark:bg-[#1a1a1f] rounded-[28px] p-6 border border-gray-100 dark:border-white/[0.06] shadow-soft animate-slide-up" style={{ animationDelay: '150ms' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Details</p>
              <div className="space-y-3 text-[11px]">
                {resource.faculty_name && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Uploaded by</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.faculty_name}</span>
                  </div>
                )}
                {resource.department_name && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Department</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.department_name}</span>
                  </div>
                )}
                {resource.semester && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Semester</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.semester}</span>
                  </div>
                )}
                {resource.subject_name && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Subject</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.subject_name}</span>
                  </div>
                )}
                {resource.resource_type && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Type</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.resource_type}</span>
                  </div>
                )}
                {resource.file_type && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Format</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{resource.file_type?.toUpperCase()}</span>
                  </div>
                )}
                {resource.file_size > 0 && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Size</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{formatSize(resource.file_size)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400 uppercase tracking-wider">Uploaded</span>
                  <span className="font-black text-gray-800 dark:text-gray-200">
                    {new Date(resource.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400 uppercase tracking-wider">Downloads</span>
                  <span className="font-black text-gray-800 dark:text-gray-200">{resource.download_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourceDetail;
