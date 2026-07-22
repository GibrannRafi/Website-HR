const pool = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE applicants ADD COLUMN requirement_analysis JSON');
    console.log('Added requirement_analysis');
  } catch (e) {
    console.log('requirement_analysis may already exist or error:', e.message);
  }
  
  try {
    await pool.query('ALTER TABLE applicants ADD COLUMN insight_summary JSON');
    console.log('Added insight_summary');
  } catch (e) {
    console.log('insight_summary may already exist or error:', e.message);
  }

  console.log('Done altering table');
  process.exit(0);
}

run();
