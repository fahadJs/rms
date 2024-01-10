const router = require('express').Router();
const whatsappController = require('./whatsappController');

router.get('/instances', whatsappController.getAllInstances);
router.post('/res/:restaurant_id/group', whatsappController.createGroupIds);
router.get('/res/:restaurant_id/group', whatsappController.getAllGroups);
router.patch('/res/:restaurant_id/group', whatsappController.updateGroups);

module.exports = router;