const router = require('express').Router();
const orderController = require('./orderController');

router.post('/:id', orderController.create);

module.exports = router;