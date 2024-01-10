const router = require('express').Router();
const telegramController = require('./telegramController');

router.get('/bots', telegramController.getAllBots);
router.post('/res/:restaurant_id/group', telegramController.createGroupIds);
router.get('/res/:restaurant_id/group', telegramController.getAllGroups);
router.patch('/res/:restaurant_id/group', telegramController.updateGroups);

module.exports = router;
