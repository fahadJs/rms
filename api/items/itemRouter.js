const router = require('express').Router();
const itemController = require('../items/intemController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id', token.verifyToken, itemController.getAll);
router.get('/res/:restaurant_id/recipewise', token.verifyToken, itemController.getForRecipeItems);
router.get('/:id', token.verifyToken, itemController.getById);
router.post('/res/:restaurant_id', token.verifyToken, itemController.create);
router.patch('/:id', token.verifyToken, itemController.update);

module.exports = router;