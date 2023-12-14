const router = require('express').Router();
const floorController = require('../floors/floorController');

router.get('/:id', floorController.getById);

module.exports = router;