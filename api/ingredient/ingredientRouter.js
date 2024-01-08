const router = require('express').Router();
const ingredientController = require('./ingredientController');

router.get('/res/:restaurant_id', ingredientController.getAll);
router.post('/res/:restaurant_id', ingredientController.create);
router.get('/:id', ingredientController.getById);
router.patch('/:id', ingredientController.update);
router.delete('/:id', ingredientController.remove);

module.exports = router;