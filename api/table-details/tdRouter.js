const router = require('express').Router();
const tdController = require('./tdController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id/:table_id', token.verifyToken, tdController.getAll);
router.patch('/res/:restaurant_id/:orderId/paid/:tid/:paidVia', token.verifyToken, tdController.mrkPaid);
router.delete('/:id', token.verifyToken, tdController.cancel);
router.delete('/:orderId/:menuItemId', token.verifyToken, tdController.removeItem);
router.patch('/:orderId/:menuItemId/:receivedQuantity/:receivedPrice', token.verifyToken, tdController.updateItemQuantity);
router.patch('/available/:table_id', tdController.markAvailable);

module.exports = router;