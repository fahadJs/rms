const router = require('express').Router();
const whatsappController = require('./whatsappController');

router.get('/', whatsappController.getAllInstances);

module.exports = router;