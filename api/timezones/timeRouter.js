const router = require('express').Router();
const timeController = require('./timeController');

router.get('/', timeController.getAll);

module.exports = router;