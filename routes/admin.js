const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { sendOrderConfirmation } = require('../mailer');
const router = express.Router();

const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];
const ORDER_STATUSES = ['awaiting_payment', 'in_queue', 'in_progress', 'review', 'completed', 'cancelled'];
// Auto-created accounts get this prefix instead of a bcrypt hash: nobody can log in
// with it, and /activate only sets a password on accounts still carrying it.
const UNACTIVATED_PREFIX = '!unactivated:';

function requireAdmin(req, res, next) {
  if (!res.locals.currentStudent || !res.locals.currentStudent.isAdmin) return res.redirect('/login');
  next();
}

router.get('/admin', requireAdmin, async (req, res) => {
  const orders = await db.allOrders();
  res.render('admin', { orders });
});

router.get('/admin/orders/:id', requireAdmin, async (req, res) => {
  const order = await db.findOrderById(req.params.id);
  if (!order) return res.status(404).send('Order not found');
  const documents = await db.documentsForOrder(order.id);
  res.render('admin-order', { order, documents, flash: req.query.flash || null });
});

router.post('/admin/orders/:id/status', requireAdmin, async (req, res) => {
  const { orderStatus, adminNotes } = req.body;
  if (!ORDER_STATUSES.includes(orderStatus)) return res.status(400).send('Invalid order status');
  await db.updateOrderStatus(req.params.id, orderStatus, adminNotes);
  res.redirect('/admin/orders/' + req.params.id);
});

// Record the result of checking a bank-transfer receipt.
router.post('/admin/orders/:id/payment', requireAdmin, async (req, res) => {
  const { paymentStatus } = req.body;
  if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).send('Invalid payment status');
  try {
    const order = await db.findOrderById(req.params.id);
    if (!order) return res.status(404).send('Order not found');
    const wasPaid = order.payment_status === 'paid';

    // Confirming payment moves a waiting order into the queue; other changes leave the order status alone.
    const nextOrderStatus = paymentStatus === 'paid' && order.order_status === 'awaiting_payment' ? 'in_queue' : order.order_status;
    await db.updateOrderPaymentStatus(order.reference, paymentStatus, nextOrderStatus);

    if (paymentStatus === 'paid' && !wasPaid) {
      // Give the student a dashboard: reuse their account or create one, and link this order to it.
      let student = await db.findStudentByEmail(order.email);
      if (!student) {
        student = await db.createStudent({
          id: uuidv4(), name: order.name, email: order.email, phone: order.phone,
          passwordHash: UNACTIVATED_PREFIX + crypto.randomBytes(16).toString('hex'), isAdmin: false
        });
        student.passwordHash = UNACTIVATED_PREFIX;
      }
      await db.linkOrderToStudent(order.id, student.id);
      const needsActivation = (student.passwordHash || '').startsWith(UNACTIVATED_PREFIX);
      const base = process.env.APP_BASE_URL || 'https://xolutionshub.onrender.com';
      const activationUrl = needsActivation ? base + '/activate?ref=' + encodeURIComponent(order.reference) : null;
      sendOrderConfirmation({ ...order, payment_status: 'paid' }, activationUrl).catch(e => console.error('Email send failed:', e.message));
      return res.redirect('/admin/orders/' + order.id + '?flash=paid');
    }
    res.redirect('/admin/orders/' + order.id + '?flash=payment');
  } catch (err) {
    console.error('Payment update failed:', err.message);
    res.status(500).send('Could not update payment. Please try again.');
  }
});

module.exports = router;
module.exports.UNACTIVATED_PREFIX = UNACTIVATED_PREFIX;
