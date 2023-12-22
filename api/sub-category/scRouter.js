const router = require('express').Router();
const scController = require('./scController');

router.post('/create', scController.create);
router.get('/', scController.getAll);

module.exports = router;