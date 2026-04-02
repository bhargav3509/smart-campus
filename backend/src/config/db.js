const { Pool } = require('pg');
require('dotenv').config(); // 

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
);

pool.connect((err, client, release) => { // [cite: 4]
  if (err) { // [cite: 4]
    console.error('Database connection error:', err.message); // [cite: 4]
  } else { // [cite: 4]
    console.log('Connected to PostgreSQL successfully!'); // [cite: 4]
    release(); // [cite: 4]
  } // [cite: 4]
}); // [cite: 4]

module.exports = pool; // [cite: 5]