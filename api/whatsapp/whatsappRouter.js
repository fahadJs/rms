const router = require('express').Router();
const whatsappController = require('./whatsappController');
const token = require('../../jwt/jwt');

router.get('/instances', token.verifyToken, whatsappController.getAllInstances);
router.post('/res/:restaurant_id/group', token.verifyToken, whatsappController.createGroupIds);
router.get('/res/:restaurant_id/group', token.verifyToken, whatsappController.getAllGroups);
router.patch('/res/:restaurant_id/group', token.verifyToken, whatsappController.updateGroups);

module.exports = router;