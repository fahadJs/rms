const router = require('express').Router();
const adminController = require('./adminController');

router.post('/login', adminController.adLogin);

module.exports = router;