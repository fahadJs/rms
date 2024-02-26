const router = require('express').Router();
const sumController = require('./sumController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id/print/daily', token.verifyToken, sumController.printDaily);
router.get('/res/:restaurant_id/print/monthly', token.verifyToken, sumController.printMonthly);
router.get('/res/:restaurant_id/print/weekly', token.verifyToken, sumController.printWeek);

module.exports = router;