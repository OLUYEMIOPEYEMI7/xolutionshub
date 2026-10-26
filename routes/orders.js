const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const db = require('../db');
const services = require('../services');
const { sendOrderReceived, sendNewOrderAlert } = require('../mailer');

const router = express.Router();
const ALLOWED_DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed'
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOC_TYPES.has(file.mimetype)) {
      return cb(new Error('That file type isn\'t supported. Please upload a PDF, Word, Excel, PowerPoint, image, text, or ZIP file.'));
    }
    cb(null, true);
  }
});

function genReference() {
  return 'XH-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Recompute pricing server-side from the submitted item keys — never trust client-sent prices.
function computeOrder(itemKeys, deliverySpeedKey) {
  const items = (itemKeys || []).map(k => services.findItem(k)).filter(Boolean);
  const servicesTotal = items.reduce((sum, i) => sum + i.price, 0);
  const speed = services.findDeliverySpeed(deliverySpeedKey);
  const handlingTotal = speed.extra;
  return { items, servicesTotal, handlingTotal, grandTotal: servicesTotal + handlingTotal, speed };
}

// Submit the order form -> create order awaiting bank transfer -> show payment instructions
router.post('/order', async (req, res) => {
  const { name, email, phone, institution, level, projectTopic, projectDescription, deliverySpeed } = req.body;
  let itemKeys = req.body.items;
  if (!itemKeys) itemKeys = [];
  if (!Array.isArray(itemKeys)) itemKeys = [itemKeys];

  if (!name || !email || itemKeys.length === 0) {
    return res.render('landing', { services, form: req.body, error: 'Please select at least one service and fill in your name and email.' });
  }

  const { items, servicesTotal, handlingTotal, grandTotal, speed } = computeOrder(itemKeys, deliverySpeed);
  if (items.length === 0) {
    return res.render('landing', { services, form: req.body, error: 'The selected services are not valid. Please try again.' });
  }

  const reference = genReference();
  const orderId = uuidv4();

  try {
    const order = await db.createOrder({
      id: orderId, reference, name, email: email.toLowerCase(), phone, institution, level,
      projectTopic, projectDescription, items, deliverySpeed: speed.key,
      servicesTotal, handlingTotal, grandTotal, paymentStatus: 'pending', orderStatus: 'awaiting_payment'
    });
    sendOrderReceived(order).catch(e => console.error('Email send failed:', e.message));
    sendNewOrderAlert(order).catch(e => console.error('Order alert email failed:', e.message));

    // Post/Redirect/Get: a refresh can't resubmit the order. Only this browser session
    // may view the payment page for this reference.
    req.session.placedOrderRef = reference;
    res.redirect(303, '/order/placed');
  } catch (err) {
    console.error('Order creation failed:', err.message);
    res.render('landing', { services, form: req.body, error: 'Something went wrong creating your order. Please try again.' });
  }
});

router.get('/order/placed', async (req, res) => {
  const reference = req.session.placedOrderRef;
  if (!reference) return res.redirect('/track');
  try {
    const order = await db.findOrderByReference(reference);
    if (!order) return res.redirect('/track');
    res.render('order-placed', { order });
  } catch (err) {
    console.error(err);
    res.redirect('/track?ref=' + encodeURIComponent(reference));
  }
});

// Public order tracking (no login required — reference + email)
router.get('/track', (req, res) => {
  res.render('track', { order: null, error: null, prefillRef: req.query.ref || '' });
});

router.post('/track', async (req, res) => {
  const { reference, email } = req.body;
  try {
    const order = await db.findOrderByReference((reference || '').trim());
    if (!order || order.email.toLowerCase() !== (email || '').trim().toLowerCase()) {
      return res.render('track', { order: null, error: 'No matching order found. Check your reference and email.', prefillRef: reference || '' });
    }
    const documents = await db.documentsForOrder(order.id);
    res.render('track', { order, documents, error: null, prefillRef: reference });
  } catch (err) {
    console.error(err);
    res.render('track', { order: null, error: 'Something went wrong. Please try again.', prefillRef: reference || '' });
  }
});

// Document upload — student must be logged in and own the order
router.post('/order/:id/documents', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) return res.status(400).send(err.message || 'Upload failed. Please check the file and try again.');
    next();
  });
}, async (req, res) => {
  if (!req.session.studentId) return res.redirect('/login');
  // Multipart requests skip the global CSRF middleware (req.body isn't parsed yet there) — verify here instead.
  if (!req.body._csrf || req.body._csrf !== req.session.csrfToken) {
    return res.status(403).send('Your session expired. Please refresh the page and try again.');
  }
  try {
    const order = await db.findOrderById(req.params.id);
    if (!order || order.student_id !== req.session.studentId) return res.status(403).send('Not authorized');
    if (!req.file) return res.redirect('/dashboard');

    await db.addDocument({
      id: require('uuid').v4(), orderId: order.id, originalName: req.file.originalname,
      mimetype: req.file.mimetype, data: req.file.buffer, uploadedBy: 'student'
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Document upload failed:', err.message);
    res.status(500).send('Upload failed');
  }
});

router.get('/documents/:id/download', async (req, res) => {
  try {
    const doc = await db.getDocument(req.params.id);
    if (!doc) return res.status(404).send('Not found');
    // Only the owning student or an admin may download
    const order = await db.findOrderById(doc.order_id);
    const isOwner = req.session.studentId && order && order.student_id === req.session.studentId;
    const isAdmin = res.locals.currentStudent && res.locals.currentStudent.isAdmin;
    if (!isOwner && !isAdmin) return res.status(403).send('Not authorized');

    res.set('Content-Type', doc.mimetype || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    res.send(doc.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Download failed');
  }
});

module.exports = router;
