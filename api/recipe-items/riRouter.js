const router = require('express').Router();
const riController = require('./riController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id', token.verifyToken, riController.getAll);
router.get('/res/:restaurant_id/ing', token.verifyToken, riController.getAllWithIngredients);
router.post('/res/:restaurant_id', token.verifyToken, riController.create);
router.get('/:id', token.verifyToken, riController.getById);
router.patch('/:id', token.verifyToken, riController.update);
router.delete('/:id', token.verifyToken, riController.deleteItem);

module.exports = router;