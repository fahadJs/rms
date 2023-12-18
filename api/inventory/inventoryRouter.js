const router = require('express').Router();
const inventoryController = require('../inventory/inventoryController');

router.get('/get', inventoryController.getAll);
router.patch('/update', inventoryController.update);
router.post('/create', inventoryController.create);

module.exports = router;