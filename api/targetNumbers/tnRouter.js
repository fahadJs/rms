const tnController = require('./tnController');
const router = require('express').Router();
const token = require('../../jwt/jwt');

router.get('/get/:custId',token.verifyToken, tnController.getAllByCust);
router.post('/assign',token.verifyToken, tnController.assignCustomerTask);
router.get('/get',token.verifyToken, tnController.getAllCust); 
router.get('/send/:custId',token.verifyToken, tnController.sendMessage);
router.post('/updatestatus/:custId',token.verifyToken, tnController.updateTargetNumbersStatus);
router.get('/resolve/:custId',token.verifyToken, tnController.resolveTask);
router.get('/reassign/:custId',token.verifyToken, tnController.reAssignCustomerTask);
router.get('/info',token.verifyToken, tnController.getAllInfo); 

module.exports = router;