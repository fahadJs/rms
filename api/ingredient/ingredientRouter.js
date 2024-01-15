const router = require('express').Router();
const ingredientController = require('./ingredientController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id', token.verifyToken, ingredientController.getAll);
router.post('/res/:restaurant_id', token.verifyToken, ingredientController.create);
router.get('/:id', token.verifyToken, ingredientController.getById);
router.patch('/:id', token.verifyToken, ingredientController.update);
router.delete('/:id', token.verifyToken, ingredientController.remove);

module.exports = router;