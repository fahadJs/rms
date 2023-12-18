const router = require('express').Router();
const kitchenController = require('./kitchenController');

router.get('/', kitchenController.getAll);

module.exports = router;