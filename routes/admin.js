const express = require('express');
const db = require('../db');
const router = express.Router();

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
  res.render('admin-order', { order, documents });
});

router.post('/admin/orders/:id/status', requireAdmin, async (req, res) => {
  const { orderStatus, adminNotes } = req.body;
  await db.updateOrderStatus(req.params.id, orderStatus, adminNotes);
  res.redirect('/admin/orders/' + req.params.id);
});

module.exports = router;
