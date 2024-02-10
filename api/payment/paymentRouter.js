const router = require('express').Router();
const paymentController = require('./paymentController');
const token = require('../../jwt/jwt');

router.post('/res/:restaurantId/create', token.verifyToken, paymentController.createPayment);
router.get('/res/:restaurantId/get', token.verifyToken, paymentController.getAll);
router.patch('/res/:restaurant_id/update/:closing_balance/:p_id', token.verifyToken, paymentController.updateBalance);

module.exports = router;