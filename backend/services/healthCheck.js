const pool = require('../config/db');

/**
 * Perform comprehensive health check for all dependent services
 * @returns {Promise<Object>} Health check report
 */
async function getHealthStatus() {
  const startTime = Date.now();
  const checks = {
    database: { status: 'unknown' },
    flask_ai: { status: 'unknown' },
    imap_email: { status: 'unknown' },
  };

  // 1. Check Database
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    checks.database = {
      status: 'ok',
      responseTimeMs: Date.now() - dbStart,
    };
  } catch (err) {
    checks.database = {
      status: 'error',
      message: err.message,
    };
  }

  // 2. Check Flask AI Service
  const scorerUrl = process.env.SCORER_URL || 'http://localhost:5001';
  try {
    const aiStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${scorerUrl}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      checks.flask_ai = {
        status: 'ok',
        url: scorerUrl,
        responseTimeMs: Date.now() - aiStart,
        details: data,
      };
    } else {
      checks.flask_ai = {
        status: 'warning',
        url: scorerUrl,
        statusCode: res.status,
      };
    }
  } catch (err) {
    checks.flask_ai = {
      status: 'offline',
      url: scorerUrl,
      message: err.name === 'AbortError' ? 'Timeout connecting to Flask service' : err.message,
    };
  }

  // 3. Check IMAP Email Config
  const imapUser = process.env.IMAP_USER;
  const imapHost = process.env.IMAP_HOST;
  if (imapUser && imapHost) {
    checks.imap_email = {
      status: 'configured',
      host: imapHost,
      user: imapUser,
    };
  } else {
    checks.imap_email = {
      status: 'not_configured',
      message: 'IMAP_USER or IMAP_HOST missing in environment',
    };
  }

  const isHealthy = checks.database.status === 'ok';

  return {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
    totalResponseTimeMs: Date.now() - startTime,
  };
}

module.exports = { getHealthStatus };
