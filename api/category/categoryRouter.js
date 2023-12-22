const router = require('express').Router();
const categoryController = require('./categoryController');

router.post('/create', categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.patch('/:id', categoryController.update);

module.exports = router;