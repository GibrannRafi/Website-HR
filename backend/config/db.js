const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_skripsi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
};

// Enable SSL if required by cloud providers like TiDB Cloud or Aiven
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const pool = mysql.createPool(poolConfig);

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL connected to database [${process.env.DB_NAME || 'db_skripsi'}] on [${process.env.DB_HOST || 'localhost'}]`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Please check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and DB_PORT in your environment settings.');
  });

module.exports = pool;
