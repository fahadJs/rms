const tnController = require('./tnController');
const router = require('express').Router();

router.get('/get/:custId', tnController.getAllByCust);
router.post('/assign', tnController.assignCustomerTask);
router.get('/get', tnController.getAllCust);

module.exports = router;