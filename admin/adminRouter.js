const router = require('express').Router();
const adminController = require('./adminController');
const token = require('../jwt/jwt');

router.post('/login', adminController.adLogin);
router.post('/', token.verifyToken, adminController.create);

module.exports = router;