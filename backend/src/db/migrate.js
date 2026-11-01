const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // ── 1. Create authorized_users table ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS authorized_users (
        id SERIAL PRIMARY KEY,
        university_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        university_email VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        assigned_role VARCHAR(20) NOT NULL CHECK (assigned_role IN ('student', 'faculty', 'admin', 'super_admin')),
        registration_status VARCHAR(20) DEFAULT 'active' CHECK (registration_status IN ('active', 'inactive', 'suspended'))
      );
    `);
    console.log('[OK] authorized_users table created (or already exists)');

    // Ensure assigned_role constraint includes super_admin if table already existed
    await client.query(`
      ALTER TABLE authorized_users DROP CONSTRAINT IF EXISTS authorized_users_assigned_role_check;
    `);
    await client.query(`
      ALTER TABLE authorized_users ADD CONSTRAINT authorized_users_assigned_role_check
        CHECK (assigned_role IN ('student', 'faculty', 'admin', 'super_admin'));
    `);

    // ── 2. Add is_active column to users (safe) ───────────────────────────────
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('[OK] is_active column added to users (or already exists)');

    // ── 3. Add university_id column to users (safe, allow NULL initially) ─────
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS university_id VARCHAR(50);
    `);
    console.log('[OK] university_id column added to users (or already exists)');

    // ── 4. Update role CHECK constraint to allow super_admin ─────────────────
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('student', 'faculty', 'admin', 'super_admin'));
    `);
    console.log('[OK] users role CHECK constraint updated to include super_admin');

    // ── 5. Seed authorized_users ──────────────────────────────────────────────
    const authorizedUsers = [
      ['24BCS11028', 'Bhargav',         '24bcs11028@cuchd.in',           'Computer Science',         'super_admin', 'active'],
      ['STU001',     'Alice Johnson',   'alice.johnson@evesphere.edu',   'Computer Science',         'student',     'active'],
      ['STU002',     'Benjamin Carter', 'ben.carter@evesphere.edu',      'Electrical Engineering',   'student',     'active'],
      ['STU003',     'Priya Sharma',    'priya.sharma@evesphere.edu',    'Information Technology',   'student',     'active'],
      ['STU004',     'Marcus Williams', 'marcus.williams@evesphere.edu', 'Mechanical Engineering',   'student',     'active'],
      ['STU005',     'Sofia Chen',      'sofia.chen@evesphere.edu',      'Computer Science',         'student',     'active'],
      ['STU006',     'Rahul Mehta',     'rahul.mehta@evesphere.edu',     'Civil Engineering',        'student',     'active'],
      ['STU007',     'Emma Thompson',   'emma.thompson@evesphere.edu',   'Business Administration',  'student',     'active'],
      ['STU008',     'David Nguyen',    'david.nguyen@evesphere.edu',    'Computer Science',         'student',     'active'],
      ['FAC001',     'Dr. Anita Kapoor','anita.kapoor@evesphere.edu',   'Computer Science',         'faculty',     'active'],
      ['FAC002',     "Prof. James O'Brien",'james.obrien@evesphere.edu', 'Electrical Engineering',   'faculty',     'active'],
      ['FAC003',     'Dr. Linda Park',  'linda.park@evesphere.edu',      'Information Technology',   'faculty',     'active'],
      ['FAC004',     'Prof. Rajesh Iyer','rajesh.iyer@evesphere.edu',    'Mechanical Engineering',   'faculty',     'active'],
      ['ADM001',     'Carol White',     'carol.white@evesphere.edu',     'Administration',           'admin',       'active'],
    ];

    for (const [uid, name, email, dept, role, status] of authorizedUsers) {
      await client.query(
        `INSERT INTO authorized_users (university_id, full_name, university_email, department, assigned_role, registration_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (university_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           university_email = EXCLUDED.university_email,
           department = EXCLUDED.department,
           assigned_role = EXCLUDED.assigned_role,
           registration_status = EXCLUDED.registration_status`,
        [uid, name, email, dept, role, status]
      );
    }
    console.log('[OK] authorized_users seeded and synchronized');

    // ── 6. Create or Update Super Admin Bhargav (24bcs11028@cuchd.in) ─────────
    const bhargavEmail = '24bcs11028@cuchd.in';
    const bhargavPassword = await bcrypt.hash('16645@b345B', 12);
    const bhargavExisting = await client.query(
      'SELECT id FROM users WHERE email = $1', [bhargavEmail]
    );

    if (bhargavExisting.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password, role, is_active, university_id, department)
         VALUES ($1, $2, $3, 'super_admin', true, $4, 'Computer Science')`,
        ['Bhargav', bhargavEmail, bhargavPassword, '24BCS11028']
      );
      console.log('[OK] Super Admin Bhargav created');
    } else {
      await client.query(
        `UPDATE users SET
           name = $1,
           password = $2,
           role = 'super_admin',
           is_active = true,
           university_id = $3,
           department = 'Computer Science'
         WHERE email = $4`,
        ['Bhargav', bhargavPassword, '24BCS11028', bhargavEmail]
      );
      console.log('[OK] Super Admin Bhargav updated with role super_admin and requested credentials');
    }

    // ── 7. Ensure fallback Super Admin exists ─────────────────────────────────
    const superAdminEmail = 'superadmin@evesphere.edu';
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1', [superAdminEmail]
    );

    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('SuperAdmin@2024!', 12);
      await client.query(
        `INSERT INTO users (name, email, password, role, is_active, university_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Super Admin', superAdminEmail, hashedPassword, 'super_admin', true, 'SUPER001']
      );
      console.log('[OK] Fallback Super Admin created');
    }

    console.log('\n[DONE] Migration completed successfully!');
  } catch (err) {
    console.error('[ERROR] Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
