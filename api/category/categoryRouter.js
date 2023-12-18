const router = require('express').Router();
const categoryController = require('./categoryController');

router.post('/create', categoryController.create);

module.exports = router;