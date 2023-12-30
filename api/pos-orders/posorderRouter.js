const router = require('express').Router();
const posorderController = require('./posorderController');

router.post('/:id', posorderController.create);
router.patch('/:id', posorderController.mrkPaid);
router.get('/', posorderController.getAllOrders);
router.get('/:id', posorderController.getOrderById);

module.exports = router;