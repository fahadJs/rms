const router = require('express').Router();
const caiController = require('./caiController');

router.get('/', caiController.getAll);
router.get('/v2', caiController.getAll2);

module.exports = router;