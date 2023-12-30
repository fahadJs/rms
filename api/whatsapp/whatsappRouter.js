const router = require('express').Router();
const whatsappController = require('./whatsappController');

router.get('/', whatsappController.getAllInstances);
router.post('/res/:restaurant_id', whatsappController.createGroupIds);

module.exports = router;