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
    const superAdminEmail = 'superadmin@evesphere.edu';

    // Check if super admin already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [superAdminEmail]
    );

    if (existing.rows.length > 0) {
      console.log('✓ Super Admin already exists. No action taken.');
      return;
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('SuperAdmin@2024!', 12);
    await client.query(
      `INSERT INTO users (name, email, password, role, is_active, university_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Super Admin', superAdminEmail, hashedPassword, 'super_admin', true, 'SUPER001']
    );

    console.log('✅ Super Admin created successfully!');
    console.log('   Email:    superadmin@evesphere.edu');
    console.log('   Password: SuperAdmin@2024!');
  } catch (err) {
    console.error('❌ Failed to create Super Admin:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initSuperAdmin();
