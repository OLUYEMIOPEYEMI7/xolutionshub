const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
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

// Set a password for a newly auto-created account (right after a first successful order).
router.get('/activate', async (req, res) => {
  const ref = req.query.ref;
  try {
    const order = await db.findOrderByReference(ref);
    if (!order || order.payment_status !== 'paid') {
      return res.status(400).render('activate', { error: 'This activation link is invalid or payment has not completed.', order: null });
    }
    res.render('activate', { error: null, order });
  } catch (err) {
    console.error(err);
    res.status(500).render('activate', { error: 'Something went wrong. Please try again.', order: null });
  }
});

router.post('/activate', async (req, res) => {
  const { ref, password } = req.body;
  try {
    const order = await db.findOrderByReference(ref);
    if (!order || order.payment_status !== 'paid') {
      return res.status(400).render('activate', { error: 'This activation link is invalid or payment has not completed.', order: null });
    }
    if (!password || password.length < 6) {
      return res.render('activate', { error: 'Password must be at least 6 characters.', order });
    }
    const student = await db.findStudentByEmail(order.email);
    if (!student) return res.status(400).render('activate', { error: 'Account not found.', order: null });

    await db.query('UPDATE xh_students SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(password, 10), student.id]);
    req.session.studentId = student.id;
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
