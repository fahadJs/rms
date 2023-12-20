const router = require('express').Router();
const splitBillController = require('./splitBillController');

router.post('/eqsplit', splitBillController.createEqSplit);
router.post('/itsplit', splitBillController.createItSplit);

module.exports = router;