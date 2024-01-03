const router = require('express').Router();
const taxController = require('./taxController');

router.patch('/res/:restaurantId/update', taxController.updateTax);

module.exports = router;