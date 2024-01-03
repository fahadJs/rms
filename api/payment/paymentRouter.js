const router = require('express').Router();
const paymentController = require('./paymentController');

router.post('/res/:restaurantId/create', paymentController.createPayment);
router.get('/res/:restaurantId/get', paymentController.getAll);

module.exports = router;