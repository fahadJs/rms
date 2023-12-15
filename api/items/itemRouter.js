const router = require('express').Router();
const itemController = require('../items/intemController');

router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.post('/', itemController.create);
router.patch('/:id', itemController.update);

module.exports = router;