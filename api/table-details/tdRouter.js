const router = require('express').Router();
const tdController = require('./tdController');

router.get('/:id', tdController.getAll);
router.patch('/:id/paid', tdController.mrkPaid);
router.delete('/:id', tdController.cancel);

module.exports = router;