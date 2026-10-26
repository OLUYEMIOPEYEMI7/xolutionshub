require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3100;
// RENDER is set on Render, K_SERVICE on Google Cloud Run.
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.K_SERVICE;

// Render (and most PaaS) sit behind a reverse proxy — required for secure cookies
// and correct req.secure / X-Forwarded-Proto detection.
app.set('trust proxy', 1);

// Public contact + bank details, shared by every view.
app.locals.site = require('./siteConfig');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions live in Postgres so logins, CSRF tokens and the "order placed" page survive
// restarts and redeploys (Render's free plan sleeps and restarts the process). The table
// is created at startup (below) with xh_-prefixed constraint/index names: the library's own
// auto-create uses "session_pkey", which clashes with other apps sharing the database.
// Without DATABASE_URL (local dev) the in-memory store is used.
const PgSession = require('connect-pg-simple')(session);
const sessionStore = process.env.DATABASE_URL
  ? new PgSession({ pool: db.pool, tableName: 'xh_sessions', createTableIfMissing: false })
  : undefined;
const SESSION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS xh_sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT xh_sessions_pkey PRIMARY KEY (sid)
  );
  CREATE INDEX IF NOT EXISTS xh_sessions_expire_idx ON xh_sessions (expire);`;

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'xh-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    secure: isProd,
    sameSite: 'lax',
    httpOnly: true
  }
}));

// Lightweight CSRF protection: a per-session token embedded in every form,
// verified on every state-changing POST. No external dependency needed.
app.use((req, res, next) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  next();
});
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  // Multipart routes (file uploads) parse their own body via multer inside the route
  // handler, which runs after this middleware — so req.body isn't populated yet here.
  // Those routes verify the CSRF token themselves, after multer has run.
  if (req.is('multipart/form-data')) return next();
  const submitted = req.body._csrf;
  if (!submitted || submitted !== req.session.csrfToken) {
    return res.status(403).send('Your session expired or this form was submitted incorrectly. Please go back and try again.');
  }
  next();
});

// Basic abuse protection on the two endpoints most worth rate-limiting.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: 'Too many login attempts. Please try again in a few minutes.' });
const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: 'Too many orders submitted. Please try again later or WhatsApp us directly.' });
app.use('/login', loginLimiter);
// Password reset: count only submissions (not page views), so a real user isn't locked out mid-reset.
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, skip: req => req.method !== 'POST', standardHeaders: true, legacyHeaders: false, message: 'Too many password reset attempts. Please try again in a few minutes.' });
app.use('/forgot-password', resetLimiter);
app.use('/reset-password', resetLimiter);
app.use('/order', orderLimiter);

// Attach current student (if logged in) to every request
app.use(async (req, res, next) => {
  res.locals.currentStudent = null;
  if (req.session.studentId) {
    try {
      res.locals.currentStudent = await db.findStudentById(req.session.studentId);
    } catch (e) { console.error('Session lookup failed:', e.message); }
  }
  next();
});

const servicesRouter = require('./routes/services-page');
const ordersRouter = require('./routes/orders');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

app.use(servicesRouter);
app.use(ordersRouter);
app.use(authRouter);
app.use(adminRouter);

app.use((req, res) => res.status(404).render('404'));

async function start() {
  if (process.env.DATABASE_URL) {
    // Must exist before the first request touches a session.
    await db.query(SESSION_TABLE_SQL);
    // Done before listening: on Cloud Run, work after startup gets little CPU until a request arrives.
    await require('./bootstrapAdmins')().catch(e => console.error('Admin bootstrap failed:', e.message));
  }
  app.listen(PORT, () => {
    console.log(`XOLUTIONS HUB running at http://localhost:${PORT}`);
  });
}
start().catch(err => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
