const router = require('express').Router();
const timeController = require('./timeController');
const token = require('../../jwt/jwt');

router.get('/', token.verifyToken, timeController.getAll);
router.get('/res/:restaurantId', token.verifyToken, timeController.getDefault);
router.patch('/:restaurantId', token.verifyToken, timeController.update);

module.exports = router;