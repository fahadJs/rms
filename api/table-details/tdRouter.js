const router = require('express').Router();
const tdController = require('./tdController');

router.get('/:id', tdController.getAll);
router.patch('/:id/paid', tdController.mrkPaid);
router.delete('/:id', tdController.cancel);
router.delete('/:orderId/:menuItemId', tdController.removeItem);

module.exports = router;