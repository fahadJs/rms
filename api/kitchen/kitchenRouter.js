const router = require('express').Router();
const kitchenController = require('./kitchenController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id', token.verifyToken, kitchenController.getAll);
router.post('/res/:restaurant_id', token.verifyToken, kitchenController.create);
router.get('/res/:restaurant_id/kit/:kitchenId', token.verifyToken, kitchenController.getById);
router.patch('/res/:restaurant_id/kit/:kitchenId', token.verifyToken, kitchenController.update);
router.delete('/res/:restaurant_id/kit/:kitchenId', token.verifyToken, kitchenController.remove);

module.exports = router;