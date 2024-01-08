const router = require('express').Router();
const itemController = require('../items/intemController');

router.get('/res/:restaurant_id', itemController.getAll);
router.get('/res/:restaurant_id/recipewise', itemController.getForRecipeItems);
router.get('/:id', itemController.getById);
router.post('/res/:restaurant_id', itemController.create);
router.patch('/:id', itemController.update);

module.exports = router;