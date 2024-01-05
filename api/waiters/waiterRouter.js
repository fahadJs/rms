const router = require('express').Router();
const waiterRouter = require('./waiterController');

router.post('/', waiterRouter.create);
router.post('/login', waiterRouter.wLogin);
router.get('/', waiterRouter.getAll);
router.get('/:id', waiterRouter.getById);
router.patch('/:id', waiterRouter.update);
router.patch('/res/:restaurant_id/:waiter_id/:new_pass', waiterRouter.passwordReset);
router.delete('/:id', waiterRouter.wdelete);

module.exports = router;