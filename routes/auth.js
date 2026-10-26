const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { UNACTIVATED_PREFIX } = require('./admin');
const { deliver, sendPasswordReset } = require('../mailer');
const resetTokens = require('../passwordReset');
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await db.findStudentByEmail((email || '').trim());
    if (!student || !bcrypt.compareSync(password || '', student.passwordHash)) {
      return res.render('login', { error: 'Invalid email or password.' });
    }
    req.session.studentId = student.id;
    res.redirect(student.isAdmin ? '/admin' : '/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Forgot / set password by email. Always answers the same way so the form can't be
// used to discover which emails have accounts.
const RESET_SENT = 'If an account exists for that email, we\'ve sent a link to set a new password. It expires in 1 hour. Check your spam folder too.';
const RESET_INVALID = 'This link is invalid, has expired, or has already been used. Request a new one below.';

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, sent: false });
});

router.post('/forgot-password', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.render('forgot-password', { error: 'Enter your email address.', sent: false });
  try {
    const student = await db.findStudentByEmail(email);
    if (student) {
      const base = process.env.APP_BASE_URL || 'https://xolutionshub.onrender.com';
      const url = base + '/reset-password?token=' + encodeURIComponent(resetTokens.createToken(student));
      await deliver('Password reset', sendPasswordReset(student.email, url));
    }
    res.render('forgot-password', { error: null, sent: true });
  } catch (err) {
    console.error(err);
    res.render('forgot-password', { error: 'Something went wrong. Please try again.', sent: false });
  }
});

async function resetTarget(token) {
  const parsed = resetTokens.readToken(token);
  if (!parsed) return null;
  const student = await db.findStudentByEmail(parsed.email);
  return resetTokens.verifyToken(parsed, student) ? student : null;
}

router.get('/reset-password', async (req, res) => {
  try {
    const student = await resetTarget(req.query.token);
    if (!student) return res.status(400).render('forgot-password', { error: RESET_INVALID, sent: false });
    res.render('reset-password', { token: req.query.token, email: student.email, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).render('forgot-password', { error: 'Something went wrong. Please try again.', sent: false });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password, confirm } = req.body;
  try {
    const student = await resetTarget(token);
    if (!student) return res.status(400).render('forgot-password', { error: RESET_INVALID, sent: false });
    if (!password || password.length < 8) {
      return res.render('reset-password', { token, email: student.email, error: 'Use at least 8 characters.' });
    }
    if (password !== confirm) {
      return res.render('reset-password', { token, email: student.email, error: 'The two passwords don\'t match.' });
    }
    await db.setStudentPassword(student.id, bcrypt.hashSync(password, 10));
    req.session.regenerate(err => {
      if (err) return res.redirect('/login');
      req.session.studentId = student.id;
      res.redirect(student.isAdmin ? '/admin' : '/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('forgot-password', { error: 'Something went wrong. Please try again.', sent: false });
  }
});

// Set a password for an account created when an admin confirmed a payment.
// Works once per account: only while it still carries the "unactivated" marker.
const INVALID_LINK = 'This activation link is invalid, already used, or payment has not been confirmed yet.';

async function activationTarget(ref) {
  const order = ref ? await db.findOrderByReference(ref) : null;
  if (!order || order.payment_status !== 'paid') return null;
  const student = await db.findStudentByEmail(order.email);
  if (!student || !(student.passwordHash || '').startsWith(UNACTIVATED_PREFIX)) return null;
  return { order, student };
}

router.get('/activate', async (req, res) => {
  try {
    const t = await activationTarget(req.query.ref);
    if (!t) return res.status(400).render('activate', { error: INVALID_LINK, order: null });
    res.render('activate', { error: null, order: t.order });
  } catch (err) {
    console.error(err);
    res.status(500).render('activate', { error: 'Something went wrong. Please try again.', order: null });
  }
});

router.post('/activate', async (req, res) => {
  const { ref, email, password } = req.body;
  try {
    const t = await activationTarget(ref);
    if (!t) return res.status(400).render('activate', { error: INVALID_LINK, order: null });
    if ((email || '').trim().toLowerCase() !== t.order.email.toLowerCase()) {
      return res.render('activate', { error: 'That email doesn\'t match this order.', order: t.order });
    }
    if (!password || password.length < 6) {
      return res.render('activate', { error: 'Password must be at least 6 characters.', order: t.order });
    }
    await db.setStudentPassword(t.student.id, bcrypt.hashSync(password, 10));
    req.session.studentId = t.student.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('activate', { error: 'Something went wrong. Please try again.', order: null });
  }
});

router.get('/dashboard', async (req, res) => {
  if (!req.session.studentId) return res.redirect('/login');
  try {
    const student = await db.findStudentById(req.session.studentId);
    if (!student) return res.redirect('/login');
    const orders = await db.ordersForStudent(student.id);
    const ordersWithDocs = await Promise.all(orders.map(async o => ({ ...o, documents: await db.documentsForOrder(o.id) })));
    const justPaid = req.session.justPaid || null;
    req.session.justPaid = null;
    res.render('dashboard', { student, orders: ordersWithDocs, justPaid });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong loading your dashboard.');
  }
});

module.exports = router;
