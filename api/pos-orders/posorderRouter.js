const router = require('express').Router();
const posorderController = require('./posorderController');

router.post('/:id', posorderController.create);
router.patch('/:orderId/paid/:tid/:paidVia', posorderController.mrkPaid);
router.get('/res/:restaurant_id', posorderController.getAllOrders);
router.get('/:id', posorderController.getOrderById);

module.exports = router;