const router = require('express').Router();
const currencyController = require('./currencyController');

router.get('/', currencyController.getAll);
router.patch('/:restaurantId', currencyController.update);

module.exports = router;