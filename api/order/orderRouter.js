const router = require('express').Router();
const orderController = require('./orderController');
const token = require('../../jwt/jwt')

router.post('/:id', orderController.create);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;