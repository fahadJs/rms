const router = require('express').Router();
const testController = require('./testController');

router.post('/:name/:price', testController.create);

module.exports = router;