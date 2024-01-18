const router = require('express').Router();
const wcsController = require('./wcsController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id/cash', token.verifyToken, wcsController.getAll);
router.patch('/res/:restaurant_id/waiter/:waiter_id/amount/:amount', token.verifyToken, wcsController.closing);

module.exports = router;