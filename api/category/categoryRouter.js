const router = require('express').Router();
const categoryController = require('./categoryController');

router.post('/res/:restaurant_id/create', categoryController.create);
router.get('/res/:restaurant_id', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.patch('/:id', categoryController.update);

module.exports = router;