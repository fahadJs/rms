const router = require('express').Router();
const taxController = require('./taxController');
const token = require('../../jwt/jwt');

router.patch('/res/:restaurantId/update', token.verifyToken, taxController.updateTax);

module.exports = router;