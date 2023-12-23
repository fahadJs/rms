const router = require('express').Router();
const ingredientController = require('./ingredientController');

router.get('/', ingredientController.getAll);
router.post('/', ingredientController.create);
router.get('/:id', ingredientController.getById);
router.patch('/:id', ingredientController.update);
router.delete('/:id', ingredientController.remove);

module.exports = router;