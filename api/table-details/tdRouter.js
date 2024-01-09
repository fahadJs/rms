const router = require('express').Router();
const tdController = require('./tdController');

router.get('/res/:restaurant_id/:table_id', tdController.getAll);
router.patch('/:orderId/paid/:tid/:paidVia', tdController.mrkPaid);
router.delete('/:id', tdController.cancel);
router.delete('/:orderId/:menuItemId', tdController.removeItem);
router.patch('/:orderId/:menuItemId/:receivedQuantity/:receivedPrice', tdController.updateItemQuantity);

module.exports = router;