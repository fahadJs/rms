const router = require('express').Router();
const riController = require('./riController');

router.get('/res/:restaurant_id', riController.getAll);
router.get('/res/:restaurant_id/ing', riController.getAllWithIngredients);
router.post('/res/:restaurant_id', riController.create);
router.get('/:id', riController.getById);
router.patch('/:id', riController.update);
router.delete('/:id', riController.deleteItem);

module.exports = router;