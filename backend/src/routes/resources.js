const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resourceUpload = require('../utils/resourceUpload');
const {
  getResources,
  getMyResources,
  getBookmarks,
  getDownloadHistory,
  getStats,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  trackDownload,
  toggleBookmark,
  rateResource,
  getComments,
  addComment,
  deleteComment,
  toggleHideComment,
  toggleFeatured,
} = require('../controllers/resourceController');

// ── List / Search / Filter ──
router.get('/', auth, getResources);

// ── Special collections (must be before /:id) ──
router.get('/my', auth, getMyResources);
router.get('/bookmarks', auth, getBookmarks);
router.get('/downloads/history', auth, getDownloadHistory);
router.get('/stats', auth, getStats);

// ── Single resource ──
router.get('/:id', auth, getResource);

// ── CRUD ──
router.post('/', auth, resourceUpload.single('file'), createResource);
router.put('/:id', auth, resourceUpload.single('file'), updateResource);
router.delete('/:id', auth, deleteResource);

// ── Actions ──
router.post('/:id/download', auth, trackDownload);
router.post('/:id/bookmark', auth, toggleBookmark);
router.post('/:id/rate', auth, rateResource);
router.put('/:id/feature', auth, toggleFeatured);

// ── Comments ──
router.get('/:id/comments', auth, getComments);
router.post('/:id/comments', auth, addComment);
router.delete('/comments/:id', auth, deleteComment);
router.put('/comments/:id/hide', auth, toggleHideComment);

module.exports = router;
