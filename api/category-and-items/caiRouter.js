const router = require('express').Router();
const caiController = require('./caiController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurant_id', token.verifyToken, caiController.getAll);
router.get('/v2/res/:restaurant_id', token.verifyToken, caiController.getAll2);
router.get('/v3', token.verifyToken, caiController.getAll3);
router.get('/v2/res/:restaurant_id/subcat/:subcategoryId', token.verifyToken, caiController.getAll2ById);

module.exports = router;