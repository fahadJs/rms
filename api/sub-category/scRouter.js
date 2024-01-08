const router = require('express').Router();
const scController = require('./scController');

router.post('/res/:restaurant_id/create', scController.create);
router.get('/res/:restaurant_id', scController.getAll);
router.get('/:id', scController.getById);
router.patch('/:id', scController.update);

module.exports = router;