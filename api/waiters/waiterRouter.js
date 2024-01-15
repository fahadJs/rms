const router = require('express').Router();
const waiterRouter = require('./waiterController');
const token = require('../../jwt/jwt');

router.post('/', token.verifyToken, waiterRouter.create);
router.post('/login', waiterRouter.wLogin);
router.get('/res/:restaurant_id', token.verifyToken, waiterRouter.getAll);
router.get('/:id', token.verifyToken, waiterRouter.getById);
router.patch('/:id', token.verifyToken, waiterRouter.update);
router.patch('/res/:restaurant_id/:waiter_id/:new_pass', token.verifyToken, waiterRouter.passwordReset);
router.delete('/:id', token.verifyToken, waiterRouter.wdelete);

module.exports = router;