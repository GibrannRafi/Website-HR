require('dotenv').config();

const requiredEnv = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
];

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please configure them in backend/.env before starting the server.');
    process.exit(1);
  }
  console.log('✅ Environment variable validation passed');
}

module.exports = { validateEnv };
