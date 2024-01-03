const router = require('express').Router();
const timeController = require('./timeController');

router.get('/', timeController.getAll);
router.patch('/:restaurantId', timeController.update);

module.exports = router;