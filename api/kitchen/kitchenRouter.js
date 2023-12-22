const router = require('express').Router();
const kitchenController = require('./kitchenController');

router.get('/', kitchenController.getAll);
router.post('/', kitchenController.create);
router.get('/:id', kitchenController.getById);
router.patch('/:id', kitchenController.update);
router.delete('/:id', kitchenController.remove);

module.exports = router;