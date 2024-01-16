const router = require('express').Router();
const splitBillController = require('./splitBillController');
const token = require('../../jwt/jwt');

router.post('/eqsplit', token.verifyToken, splitBillController.createEqSplit);
router.post('/res/:restaurant_id/itsplit', token.verifyToken, splitBillController.createItSplit);

module.exports = router;