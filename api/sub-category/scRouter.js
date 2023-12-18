const router = require('express').Router();
const scController = require('./scController');

router.post('/create', scController.create);

module.exports = router;