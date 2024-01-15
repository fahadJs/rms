const router = require('express').Router();
const categoryController = require('./categoryController');
const token = require('../../jwt/jwt');

router.post('/res/:restaurant_id/create', token.verifyToken, categoryController.create);
router.get('/res/:restaurant_id', token.verifyToken, categoryController.getAll);
router.get('/:id', token.verifyToken, categoryController.getById);
router.patch('/:id', token.verifyToken, categoryController.update);

module.exports = router;