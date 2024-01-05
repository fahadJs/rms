const router = require('express').Router();
const extrasController = require('./extrasController');

router.get('/res/:restaurant_id/:MenuItemID');

module.exports = router;