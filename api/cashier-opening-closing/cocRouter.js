const router = require('express').Router();
const cocController = require('./cocController');

router.get('/res/:restaurant_id/denom/get', cocController.getDenominations);
router.get('/res/:restaurant_id/posclosing/get', cocController.getPosClosing);
router.post('/res/:restaurant_id/posclosing/create', cocController.posClosing);

module.exports = router;