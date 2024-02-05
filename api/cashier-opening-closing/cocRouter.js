const router = require('express').Router();
const cocController = require('./cocController');

router.get('/res/:restaurant_id/denom/get', cocController.getDenominations);

module.exports = router;