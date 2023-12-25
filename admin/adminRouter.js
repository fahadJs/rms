const router = require('express').Router();
const adminController = require('./adminController');

router.post('/login', adminController.adLogin);
router.post('/', adminController.create);

module.exports = router;