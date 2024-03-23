const router = require('express').Router();
const fcController = require('./fcController');
const token = require('../../jwt/jwt');

router.post('/res/:restaurant_id/create', token.verifyToken, fcController.addDailyFixedCost);
router.get('/res/:restaurant_id/get', token.verifyToken, fcController.getDailyFixedCost);

module.exports = router;