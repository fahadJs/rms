const router = require('express').Router();
const caikController = require('./caikController');

router.get('/', caikController.getAll);

module.exports = router;