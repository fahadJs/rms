const router = require('express').Router();
const paymentController = require('./paymentController');
const token = require('../../jwt/jwt');

router.post('/res/:restaurantId/create', token.verifyToken, paymentController.createPayment);
router.get('/res/:restaurantId/get', token.verifyToken, paymentController.getAll);

module.exports = router;