const pool = require('../config/db');
const { uploadToS3 } = require('../utils/s3');
const { createNotification } = require('./notificationController');

// ── Helper: format file size ──
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ── Helper: recalculate average rating ──
const recalcAvgRating = async (resourceId) => {
  const result = await pool.query(
    `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg
     FROM resource_ratings WHERE resource_id = $1`,
    [resourceId]
  );
  const avg = result.rows[0].avg;
  await pool.query(
    `UPDATE resources SET avg_rating = $1 WHERE id = $2`,
    [avg, resourceId]
  );
  return avg;
};

// ════════════════════════════════════════════════════════════
//  RESOURCES
// ════════════════════════════════════════════════════════════

// GET /resources — list / search / filter (all roles)
exports.getResources = async (req, res) => {
  try {
    const { search, department_id, semester, subject_id, category_id, faculty_id, file_type, sort, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT r.*,
             u.name as faculty_name,
             d.name as department_name,
             s.name as subject_name,
             rc.name as category_name,
             rc.icon as category_icon
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      LEFT JOIN resource_categories rc ON r.category_id = rc.id
      WHERE r.status = 'active'
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (r.title ILIKE $${params.length} OR r.description ILIKE $${params.length} OR array_to_string(r.tags, ',') ILIKE $${params.length})`;
    }
    if (department_id) {
      params.push(department_id);
      query += ` AND r.department_id = $${params.length}`;
    }
    if (semester) {
      params.push(parseInt(semester));
      query += ` AND r.semester = $${params.length}`;
    }
    if (subject_id) {
      params.push(subject_id);
      query += ` AND r.subject_id = $${params.length}`;
    }
    if (category_id) {
      params.push(category_id);
      query += ` AND r.category_id = $${params.length}`;
    }
    if (faculty_id) {
      params.push(faculty_id);
      query += ` AND r.uploaded_by = $${params.length}`;
    }
    if (file_type) {
      params.push(file_type);
      query += ` AND r.file_type = $${params.length}`;
    }

    // Sorting
    switch (sort) {
      case 'oldest':    query += ` ORDER BY r.created_at ASC`; break;
      case 'downloads': query += ` ORDER BY r.download_count DESC`; break;
      case 'rating':    query += ` ORDER BY r.avg_rating DESC`; break;
      case 'title':     query += ` ORDER BY r.title ASC`; break;
      default:          query += ` ORDER BY r.created_at DESC`; break; // newest
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/my — faculty's own uploads
exports.getMyResources = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              d.name as department_name,
              s.name as subject_name,
              rc.name as category_name,
              rc.icon as category_icon
       FROM resources r
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN subjects s ON r.subject_id = s.id
       LEFT JOIN resource_categories rc ON r.category_id = rc.id
       WHERE r.uploaded_by = $1 AND r.status != 'deleted'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/bookmarks — student's bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.name as faculty_name,
              d.name as department_name,
              s.name as subject_name,
              rc.name as category_name,
              rc.icon as category_icon,
              rb.created_at as bookmarked_at
       FROM resource_bookmarks rb
       JOIN resources r ON rb.resource_id = r.id
       LEFT JOIN users u ON r.uploaded_by = u.id
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN subjects s ON r.subject_id = s.id
       LEFT JOIN resource_categories rc ON r.category_id = rc.id
       WHERE rb.user_id = $1 AND r.status = 'active'
       ORDER BY rb.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/downloads/history — student's download history
exports.getDownloadHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.name as faculty_name,
              d.name as department_name,
              rd.downloaded_at
       FROM resource_downloads rd
       JOIN resources r ON rd.resource_id = r.id
       LEFT JOIN users u ON r.uploaded_by = u.id
       LEFT JOIN departments d ON r.department_id = d.id
       WHERE rd.user_id = $1
       ORDER BY rd.downloaded_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/stats — admin analytics
exports.getStats = async (req, res) => {
  try {
    const [total, thisMonth, topDownloaded, topRated, recentUploads, downloadStats] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM resources WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) as count FROM resources WHERE status = 'active' AND created_at >= date_trunc('month', CURRENT_DATE)`),
      pool.query(
        `SELECT r.id, r.title, r.download_count, u.name as faculty_name
         FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id
         WHERE r.status = 'active' ORDER BY r.download_count DESC LIMIT 10`
      ),
      pool.query(
        `SELECT r.id, r.title, r.avg_rating, u.name as faculty_name
         FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id
         WHERE r.status = 'active' AND r.avg_rating > 0 ORDER BY r.avg_rating DESC LIMIT 10`
      ),
      pool.query(
        `SELECT r.id, r.title, r.created_at, u.name as faculty_name, d.name as department_name
         FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id LEFT JOIN departments d ON r.department_id = d.id
         WHERE r.status = 'active' ORDER BY r.created_at DESC LIMIT 10`
      ),
      pool.query(
        `SELECT DATE(downloaded_at) as date, COUNT(*) as count
         FROM resource_downloads
         WHERE downloaded_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(downloaded_at) ORDER BY date`
      ),
    ]);

    res.json({
      total_resources: parseInt(total.rows[0].count),
      this_month: parseInt(thisMonth.rows[0].count),
      top_downloaded: topDownloaded.rows,
      top_rated: topRated.rows,
      recent_uploads: recentUploads.rows,
      download_stats: downloadStats.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/:id — single resource
exports.getResource = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.name as faculty_name,
              u.email as faculty_email,
              d.name as department_name,
              s.name as subject_name,
              rc.name as category_name,
              rc.icon as category_icon
       FROM resources r
       LEFT JOIN users u ON r.uploaded_by = u.id
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN subjects s ON r.subject_id = s.id
       LEFT JOIN resource_categories rc ON r.category_id = rc.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resource = result.rows[0];

    // Check bookmark status for current user
    const bookmark = await pool.query(
      `SELECT id FROM resource_bookmarks WHERE user_id = $1 AND resource_id = $2`,
      [req.user.id, req.params.id]
    );
    resource.is_bookmarked = bookmark.rows.length > 0;

    // Get user's rating if any
    const userRating = await pool.query(
      `SELECT rating FROM resource_ratings WHERE user_id = $1 AND resource_id = $2`,
      [req.user.id, req.params.id]
    );
    resource.user_rating = userRating.rows.length > 0 ? userRating.rows[0].rating : 0;

    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /resources — upload new resource (faculty/admin)
exports.createResource = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Faculty or Admin only' });
    }

    const { title, description, external_url, department_id, semester, subject_id, category_id, tags, resource_type } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let file_url = null;
    let file_size = 0;
    let file_type = null;

    if (req.file) {
      file_url = await uploadToS3(req.file, 'resources');
      file_size = req.file.size;
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      file_type = ext;
    }

    // Parse tags — accept comma-separated string or JSON array
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
      } catch { parsedTags = []; }
    }

    const result = await pool.query(
      `INSERT INTO resources (title, description, file_url, file_size, file_type, resource_type, external_url, department_id, semester, subject_id, category_id, uploaded_by, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        title,
        description || null,
        file_url,
        file_size,
        file_type,
        resource_type || null,
        external_url || null,
        department_id || null,
        semester ? parseInt(semester) : null,
        subject_id || null,
        category_id || null,
        req.user.id,
        parsedTags,
      ]
    );

    const resource = result.rows[0];

    // Notify students in same department/semester
    if (department_id || semester) {
      try {
        const faculty = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const facultyName = faculty.rows[0]?.name || 'A faculty member';

        let studentQuery = `SELECT id FROM users WHERE role = 'student'`;
        const studentParams = [];

        if (department_id) {
          // Get department name for notification
          const dept = await pool.query('SELECT name FROM departments WHERE id = $1', [department_id]);
          const deptName = dept.rows[0]?.name || '';

          // Match students by department name (users table stores department as string)
          if (deptName) {
            studentParams.push(deptName);
            studentQuery += ` AND department ILIKE $${studentParams.length}`;
          }
        }

        const students = await pool.query(studentQuery, studentParams);
        const msg = `📚 New resource: "${title}" uploaded by ${facultyName}${semester ? ` (Sem ${semester})` : ''}`;
        for (const student of students.rows) {
          createNotification(student.id, msg);
        }
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /resources/:id — edit resource (owner or admin)
exports.updateResource = async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resource = existing.rows[0];
    if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this resource' });
    }

    const { title, description, external_url, department_id, semester, subject_id, category_id, tags, resource_type } = req.body;

    let parsedTags = resource.tags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
      } catch { /* keep existing */ }
    }

    // If a new file is uploaded, replace the old one
    let file_url = resource.file_url;
    let file_size = resource.file_size;
    let file_type = resource.file_type;
    if (req.file) {
      file_url = await uploadToS3(req.file, 'resources');
      file_size = req.file.size;
      file_type = req.file.originalname.split('.').pop().toLowerCase();
    }

    const result = await pool.query(
      `UPDATE resources SET
        title = $1, description = $2, file_url = $3, file_size = $4, file_type = $5,
        resource_type = $6, external_url = $7, department_id = $8, semester = $9,
        subject_id = $10, category_id = $11, tags = $12, updated_at = now()
       WHERE id = $13 RETURNING *`,
      [
        title || resource.title,
        description !== undefined ? description : resource.description,
        file_url,
        file_size,
        file_type,
        resource_type || resource.resource_type,
        external_url !== undefined ? external_url : resource.external_url,
        department_id || resource.department_id,
        semester ? parseInt(semester) : resource.semester,
        subject_id || resource.subject_id,
        category_id || resource.category_id,
        parsedTags,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /resources/:id — delete resource (owner or admin)
exports.deleteResource = async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resource = existing.rows[0];
    if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    // Soft delete
    await pool.query(`UPDATE resources SET status = 'deleted' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /resources/:id/download — track download
exports.trackDownload = async (req, res) => {
  try {
    const resource = await pool.query('SELECT file_url FROM resources WHERE id = $1 AND status = $2', [req.params.id, 'active']);
    if (resource.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Record download
    await pool.query(
      `INSERT INTO resource_downloads (user_id, resource_id) VALUES ($1, $2)`,
      [req.user.id, req.params.id]
    );

    // Increment counter
    await pool.query(
      `UPDATE resources SET download_count = download_count + 1 WHERE id = $1`,
      [req.params.id]
    );

    res.json({ file_url: resource.rows[0].file_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /resources/:id/bookmark — toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT id FROM resource_bookmarks WHERE user_id = $1 AND resource_id = $2`,
      [req.user.id, req.params.id]
    );

    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM resource_bookmarks WHERE id = $1`, [existing.rows[0].id]);
      res.json({ bookmarked: false });
    } else {
      await pool.query(
        `INSERT INTO resource_bookmarks (user_id, resource_id) VALUES ($1, $2)`,
        [req.user.id, req.params.id]
      );
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /resources/:id/rate — upsert rating (1-5)
exports.rateResource = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    await pool.query(
      `INSERT INTO resource_ratings (user_id, resource_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, resource_id)
       DO UPDATE SET rating = $3`,
      [req.user.id, req.params.id, parseInt(rating)]
    );

    const avg = await recalcAvgRating(req.params.id);

    // Notify faculty if high rating
    if (parseInt(rating) >= 4) {
      try {
        const resource = await pool.query('SELECT title, uploaded_by FROM resources WHERE id = $1', [req.params.id]);
        if (resource.rows.length > 0) {
          const { title, uploaded_by } = resource.rows[0];
          createNotification(uploaded_by, `⭐ Your resource "${title}" received a ${rating}★ rating!`);
        }
      } catch { /* non-critical */ }
    }

    res.json({ rating: parseInt(rating), avg_rating: avg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /resources/:id/comments — get comments
exports.getComments = async (req, res) => {
  try {
    let query = `
      SELECT rc.*, u.name as user_name, u.avatar_url
      FROM resource_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE rc.resource_id = $1
    `;
    // Non-admins don't see hidden comments
    if (req.user.role !== 'admin') {
      query += ` AND rc.is_hidden = false`;
    }
    query += ` ORDER BY rc.created_at DESC`;

    const result = await pool.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /resources/:id/comments — add comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const result = await pool.query(
      `INSERT INTO resource_comments (user_id, resource_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, req.params.id, content.trim()]
    );

    // Notify resource owner
    try {
      const resource = await pool.query('SELECT title, uploaded_by FROM resources WHERE id = $1', [req.params.id]);
      if (resource.rows.length > 0 && resource.rows[0].uploaded_by !== req.user.id) {
        const commenter = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const commenterName = commenter.rows[0]?.name || 'Someone';
        createNotification(
          resource.rows[0].uploaded_by,
          `💬 ${commenterName} commented on your resource "${resource.rows[0].title}"`
        );
      }
    } catch { /* non-critical */ }

    // Fetch complete comment with user info
    const full = await pool.query(
      `SELECT rc.*, u.name as user_name, u.avatar_url
       FROM resource_comments rc LEFT JOIN users u ON rc.user_id = u.id
       WHERE rc.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /resources/comments/:id — delete comment (owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await pool.query('SELECT * FROM resource_comments WHERE id = $1', [req.params.id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.query('DELETE FROM resource_comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /resources/comments/:id/hide — toggle hide comment (admin)
exports.toggleHideComment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      `UPDATE resource_comments SET is_hidden = NOT is_hidden WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /resources/:id/feature — toggle featured (admin)
exports.toggleFeatured = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      `UPDATE resources SET is_featured = NOT is_featured WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Notify faculty if featured
    if (result.rows[0].is_featured) {
      createNotification(
        result.rows[0].uploaded_by,
        `🌟 Your resource "${result.rows[0].title}" has been featured!`
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ════════════════════════════════════════════════════════════

exports.getDepartments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const result = await pool.query(
      'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *',
      [name, code.toUpperCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Department already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, code, is_active } = req.body;
    const result = await pool.query(
      `UPDATE departments SET name = COALESCE($1, name), code = COALESCE($2, code), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *`,
      [name, code ? code.toUpperCase() : null, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
//  SUBJECTS
// ════════════════════════════════════════════════════════════

exports.getSubjects = async (req, res) => {
  try {
    const { department_id, semester } = req.query;
    let query = `
      SELECT s.*, d.name as department_name
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.is_active = true
    `;
    const params = [];
    if (department_id) {
      params.push(department_id);
      query += ` AND s.department_id = $${params.length}`;
    }
    if (semester) {
      params.push(parseInt(semester));
      query += ` AND s.semester = $${params.length}`;
    }
    query += ` ORDER BY s.semester ASC, s.name ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, code, department_id, semester } = req.body;
    if (!name || !code || !department_id || !semester) {
      return res.status(400).json({ message: 'Name, code, department, and semester are required' });
    }
    const result = await pool.query(
      'INSERT INTO subjects (name, code, department_id, semester) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code.toUpperCase(), department_id, parseInt(semester)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Subject code already exists for this department' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, code, department_id, semester, is_active } = req.body;
    const result = await pool.query(
      `UPDATE subjects SET
        name = COALESCE($1, name), code = COALESCE($2, code),
        department_id = COALESCE($3, department_id), semester = COALESCE($4, semester),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [name, code ? code.toUpperCase() : null, department_id, semester ? parseInt(semester) : null, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Subject not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
//  RESOURCE CATEGORIES
// ════════════════════════════════════════════════════════════

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resource_categories WHERE is_active = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await pool.query(
      'INSERT INTO resource_categories (name, slug, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, icon || '📄']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { name, icon, is_active } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;
    const result = await pool.query(
      `UPDATE resource_categories SET name = COALESCE($1, name), slug = COALESCE($2, slug), icon = COALESCE($3, icon), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *`,
      [name, slug, icon, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    await pool.query('DELETE FROM resource_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
