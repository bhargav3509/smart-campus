// Run this script separately to initialize the super admin
// Usage: node init-super-admin.js
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: './src/../.env' });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'smart_campus',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '11028',
      }
);

async function initSuperAdmin() {
  const client = await pool.connect();
  try {
    // 1. Create or Update Bhargav
    const bhargavEmail = '24bcs11028@cuchd.in';
    const bhargavPassword = await bcrypt.hash('16645@b345B', 12);
    const bhargavExisting = await client.query('SELECT id FROM users WHERE email = $1', [bhargavEmail]);

    if (bhargavExisting.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password, role, is_active, university_id, department)
         VALUES ($1, $2, $3, 'super_admin', true, $4, 'Computer Science')`,
        ['Bhargav', bhargavEmail, bhargavPassword, '24BCS11028']
      );
      console.log('✅ Super Admin created: Bhargav (24bcs11028@cuchd.in)');
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
      console.log('✅ Super Admin updated: Bhargav (24bcs11028@cuchd.in)');
    }

    // Also sync to authorized_users if table exists
    try {
      await client.query(
        `INSERT INTO authorized_users (university_id, full_name, university_email, department, assigned_role, registration_status)
         VALUES ('24BCS11028', 'Bhargav', '24bcs11028@cuchd.in', 'Computer Science', 'super_admin', 'active')
         ON CONFLICT (university_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           university_email = EXCLUDED.university_email,
           department = EXCLUDED.department,
           assigned_role = EXCLUDED.assigned_role,
           registration_status = EXCLUDED.registration_status`
      );
      console.log('✅ Synced to authorized_users table');
    } catch (e) {
      // ignore if authorized_users not migrated yet
    }

    console.log('   Email:    24bcs11028@cuchd.in');
    console.log('   Password: 16645@b345B');
    console.log('   Role:     super_admin');
    console.log('   UID:      24BCS11028');
  } catch (err) {
    console.error('❌ Failed to create Super Admin:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initSuperAdmin();
