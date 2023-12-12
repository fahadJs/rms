const router = require('express').Router();
const itemController = require('../items/intemController');

router.get('/', itemController.getAll);
router.post('/', itemController.create);

module.exports = router;