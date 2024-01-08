const router = require('express').Router();
const inventoryController = require('../inventory/inventoryController');

router.get('/res/:restaurant_id/get', inventoryController.getAll);
router.patch('/res/:restaurant_id/update', inventoryController.update);
router.post('/res/:restaurant_id/create', inventoryController.create);
router.patch('/res/:restaurant_id/:mid/:ohid', inventoryController.updateOnHand);

module.exports = router;