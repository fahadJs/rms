const router = require('express').Router();
const caiController = require('./caiController');

router.get('/', caiController.getAll);
router.get('/v2', caiController.getAll2);
router.get('/v3', caiController.getAll3);
router.get('/v2/:id', caiController.getAll2ById);

module.exports = router;