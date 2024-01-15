const router = require('express').Router();
const currencyController = require('./currencyController');
const token = require('../../jwt/jwt');

router.get('/', token.verifyToken, currencyController.getAll);
router.patch('/:restaurantId', token.verifyToken, currencyController.update);

module.exports = router;