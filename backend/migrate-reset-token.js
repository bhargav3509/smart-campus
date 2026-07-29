const pool = require('./src/config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
    `);
    console.log('✅ Migration successful: reset_token and reset_token_expiry columns added.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
