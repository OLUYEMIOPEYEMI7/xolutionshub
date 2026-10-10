require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3100;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'xh-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 days
}));

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

app.listen(PORT, () => {
  console.log(`XOLUTIONS HUB running at http://localhost:${PORT}`);
});
