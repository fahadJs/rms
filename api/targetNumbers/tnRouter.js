const tnController = require('./tnController');
const router = require('express').Router();

router.get('/get', tnController.getAll);
router.post('/assign', tnController.assignCustomerTask);

module.exports = router;