const router = require('express').Router();
const cocController = require('./cocController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id/denom/get', token.verifyToken, cocController.getDenominations);
router.get('/res/:restaurant_id/posclosing/get',token.verifyToken, cocController.getPosClosing);
router.post('/res/:restaurant_id/posclosing/create',token.verifyToken, cocController.posClosing);
router.get('/res/:restaurant_id/cashin/get',token.verifyToken, cocController.getCashIn);
router.get('/res/:restaurant_id/cashout/get',token.verifyToken, cocController.getCashOut);
router.post('/res/:restaurant_id/cashin/create',token.verifyToken, cocController.cashIn);
router.post('/res/:restaurant_id/cashout/create',token.verifyToken, cocController.cashOut);
router.get('/res/:restaurant_id/cashdrawer', cocController.openCashDrawer);

module.exports = router;