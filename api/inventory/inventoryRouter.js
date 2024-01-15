const router = require('express').Router();
const inventoryController = require('../inventory/inventoryController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id/get', token.verifyToken, inventoryController.getAll);
router.patch('/res/:restaurant_id/update', token.verifyToken, inventoryController.update);
router.post('/res/:restaurant_id/create', token.verifyToken, inventoryController.create);
router.patch('/res/:restaurant_id/:mid/:ohid', token.verifyToken, inventoryController.updateOnHand);

module.exports = router;