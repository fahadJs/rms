const router = require('express').Router();
const telegramController = require('./telegramController');
const token = require('../../jwt/jwt');

router.get('/bots', token.verifyToken, telegramController.getAllBots);
router.post('/res/:restaurant_id/group', token.verifyToken, telegramController.createGroupIds);
router.get('/res/:restaurant_id/group', token.verifyToken, telegramController.getAllGroups);
router.patch('/res/:restaurant_id/group', token.verifyToken, telegramController.updateGroups);

module.exports = router;
