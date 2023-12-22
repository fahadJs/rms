const router = require('express').Router();
const scController = require('./scController');

router.post('/create', scController.create);
router.get('/', scController.getAll);
router.get('/:id', scController.getById);
router.patch('/:id', scController.update);

module.exports = router;