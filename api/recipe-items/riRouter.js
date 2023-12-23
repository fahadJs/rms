const router = require('express').Router();
const riController = require('./riController');

router.get('/', riController.getAll);
router.post('/', riController.create);
router.get('/:id', riController.getById);
router.patch('/:id', riController.update);
router.delete('/:id', riController.deleteItem);

module.exports = router;