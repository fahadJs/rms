const router = require('express').Router();
const orderController = require('./orderController');
const token = require('../../jwt/jwt');

router.post('/:id', token.verifyToken, orderController.create);
router.get('/res/:restaurant_id', orderController.getAllOrders);
router.get('/:id', token.verifyToken, orderController.getOrderById);

module.exports = router;