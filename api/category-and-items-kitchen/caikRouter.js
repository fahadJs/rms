const router = require('express').Router();
const caikController = require('./caikController');
const token = require('../../jwt/jwt');

router.get('/:restaurant_id', token.verifyToken, caikController.getAll);

module.exports = router;