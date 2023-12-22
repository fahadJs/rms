const router = require('express').Router();
const categoryController = require('./categoryController');

router.post('/create', categoryController.create);
router.get('/', categoryController.getAll);

module.exports = router;