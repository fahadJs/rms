const router = require('express').Router();
const testRmsController = require('./testRmsController');

router.get('/get', testRmsController.test);

module.exports = router;