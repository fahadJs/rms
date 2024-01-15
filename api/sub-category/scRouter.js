const router = require('express').Router();
const scController = require('./scController');
const token = require('../../jwt/jwt');

router.post('/res/:restaurant_id/create', token.verifyToken, scController.create);
router.get('/res/:restaurant_id', token.verifyToken, scController.getAll);
router.get('/:id', token.verifyToken, scController.getById);
router.patch('/:id', token.verifyToken, scController.update);

module.exports = router;