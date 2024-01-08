const router = require('express').Router();
const kitchenController = require('./kitchenController');

router.get('/res/:restaurant_id', kitchenController.getAll);
router.post('/res/:restaurant_id', kitchenController.create);
router.get('/res/:restaurant_id/kit/:kitchenId', kitchenController.getById);
router.patch('/res/:restaurant_id/kit/:kitchenId', kitchenController.update);
router.delete('/res/:restaurant_id/kit/:kitchenId', kitchenController.remove);

module.exports = router;