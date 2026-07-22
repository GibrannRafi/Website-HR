const pool = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE applicants ADD COLUMN matched_keywords JSON');
    console.log('Added matched_keywords');
  } catch (e) {
    console.log('matched_keywords may already exist or error:', e.message);
  }
  
  try {
    await pool.query('ALTER TABLE applicants ADD COLUMN missing_keywords JSON');
    console.log('Added missing_keywords');
  } catch (e) {
    console.log('missing_keywords may already exist or error:', e.message);
  }

  console.log('Done altering table');
  process.exit(0);
}

run();
