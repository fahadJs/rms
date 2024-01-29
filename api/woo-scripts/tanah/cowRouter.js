const cowController = require('./cowController');
const router = require('express').Router();

router.get('/get', cowController.getAllOrders);

module.exports = router;