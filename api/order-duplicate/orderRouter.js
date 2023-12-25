const router = require('express').Router();
const orderController = require('./orderController');

router.post('/:id', orderController.create);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;