const router = require('express').Router();
const caikController = require('./caikController');

router.get('/:restaurant_id', caikController.getAll);

module.exports = router;