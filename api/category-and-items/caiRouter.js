const router = require('express').Router();
const caiController = require('./caiController');

router.get('/', caiController.getAll);

module.exports = router;