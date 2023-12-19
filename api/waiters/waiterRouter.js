const router = require('express').Router();
const waiterRouter = require('./waiterController');

router.post('/', waiterRouter.create);
router.post('/login', waiterRouter.wLogin);

module.exports = router;