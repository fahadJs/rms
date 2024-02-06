const router = require('express').Router();
const cocController = require('./cocController');

router.get('/res/:restaurant_id/denom/get', cocController.getDenominations);
router.get('/res/:restaurant_id/posclosing/get', cocController.getPosClosing);
router.post('/res/:restaurant_id/posclosing/create', cocController.posClosing);
router.get('/res/:restaurant_id/cashin/get', cocController.getCashIn);
router.get('/res/:restaurant_id/cashout/get', cocController.getCashOut);
router.post('/res/:restaurant_id/cashin/create', cocController.cashIn);
router.post('/res/:restaurant_id/cashout/create', cocController.cashOut);

module.exports = router;