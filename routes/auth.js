const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { UNACTIVATED_PREFIX } = require('./admin');
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
