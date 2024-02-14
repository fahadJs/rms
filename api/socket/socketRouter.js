const router = require('express').Router();
const socketController = require('./socketController');

router.get('/', socketController.testScoket);

module.exports = router;