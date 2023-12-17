const router = require('express').Router();
const inventoryController = require('../inventory/inventoryController');

router.get('/', inventoryController.getAll);

module.exports = router;