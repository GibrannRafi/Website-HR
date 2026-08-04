require('dotenv').config();

const { validateEnv } = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { getHealthStatus } = require('./services/healthCheck');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for reverse proxy platforms (Railway, Vercel, Heroku, etc.)
app.set('trust proxy', 1);

// ============================================================
// Logging & Middleware
// ============================================================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS setup supporting local dev & production origins (e.g., Vercel)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy rejection: Origin ${origin} not permitted`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded CVs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Rate Limiter (Applied ONLY to Authentication Routes)
// ============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login/registration attempts from this IP, please try again after 15 minutes.' },
});

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/jobdesks', require('./routes/jobdesks'));
app.use('/api/applicants', require('./routes/applicants'));
app.use('/api/admin', require('./routes/admin'));

// Comprehensive Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: err.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled application error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Portal HR Backend running on port ${PORT}`);
  console.log(`   📊 API Health: http://localhost:${PORT}/api/health`);

  // Check Python scorer service
  const { isScorerAvailable } = require('./ml/scorer');
  isScorerAvailable().then((ok) => {
    if (ok) {
      console.log('✅ TalentSift v2 Python scorer: ONLINE');
    } else {
      console.warn('⚠️  TalentSift v2 scorer OFFLINE — start service with: python backend/ml/scorer_service.py');
    }
  });

  // Start email poller (if IMAP configured)
  try {
    const { startEmailPoller } = require('./services/emailPoller');
    startEmailPoller();
  } catch (err) {
    console.warn('⚠️  Email poller initialization warning:', err.message);
  }
});

module.exports = app;
