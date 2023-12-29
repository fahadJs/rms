const router = require('express').Router();
const caiController = require('./caiController');

router.get('/', caiController.getAll);
router.get('/v2/res/:restaurant_id', caiController.getAll2);
router.get('/v3', caiController.getAll3);
router.get('/v2/res/:restaurant_id/subcat/:subcategoryId', caiController.getAll2ById);

module.exports = router;