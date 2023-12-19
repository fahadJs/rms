const router = require('express').Router();
const floorController = require('../floors/floorController');
const token = require('../../jwt/jwt');

router.get('/:id', token.verifyToken, floorController.getById);

module.exports = router;