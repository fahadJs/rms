const router = require('express').Router();
const tdController = require('./tdController');

router.get('/:id', tdController.getAll);

module.exports = router;