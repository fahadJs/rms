const router = require('express').Router();
const waController = require('./waCont');

router.get('/:message/:number', waController.sendMessage);

module.exports = router;

