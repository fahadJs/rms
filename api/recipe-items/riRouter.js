const router = require('express').Router();
const riController = require('./riController');

router.get('/', riController.getAll);
router.get('/ing', riController.getAllWithIngredients);
router.post('/', riController.create);
router.get('/:id', riController.getById);
router.patch('/:id', riController.update);
router.delete('/:id', riController.deleteItem);

module.exports = router;