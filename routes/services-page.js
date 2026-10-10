const express = require('express');
const services = require('../services');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('landing', { services });
});

router.get('/services', (req, res) => {
  res.redirect('/#services');
});

module.exports = router;
