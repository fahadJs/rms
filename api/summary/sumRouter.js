const router = require('express').Router();
const sumController = require('./sumController');

router.get('/res/:restaurant_id/print', sumController.printDaily);

module.exports = router;