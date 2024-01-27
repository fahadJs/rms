const router = require('express').Router();
const posorderController = require('./posorderController');
const token = require('../../jwt/jwt');

router.post('/:id', token.verifyToken, posorderController.create);
router.patch('/:orderId/paid/:tid/:paidVia', token.verifyToken, posorderController.mrkPaid);
router.get('/res/:restaurant_id', posorderController.getAllOrders);
router.get('/:id', token.verifyToken, posorderController.getOrderById);

module.exports = router;