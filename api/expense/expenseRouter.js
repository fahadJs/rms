const router = require('express').Router();
const expenseController = require('./expenseController');
const token = require('../../jwt/jwt');

router.get('/res/:restaurantId/pos/monthly', token.verifyToken, expenseController.getPosMonthlyExpense);
router.get('/res/:restaurantId/pos/weekly', token.verifyToken, expenseController.getPosWeeklyExpense);
router.get('/res/:restaurantId/pos/daily', token.verifyToken, expenseController.getPosDailyExpense);

router.get('/res/:restaurantId/waiter/monthly/admin', token.verifyToken, expenseController.getWaiterMonthlyExpenseAdmin);
router.get('/res/:restaurantId/waiter/weekly/admin', token.verifyToken, expenseController.getWaiterWeeklyExpenseAdmin);
router.get('/res/:restaurantId/waiter/daily/admin', token.verifyToken, expenseController.getWaiterDailyExpenseAdmin);

router.get('/res/:restaurantId/combined/daily', expenseController.getCombinedDailyExpense);

router.get('/res/:restaurantId/combined/monthly', expenseController.getCombinedMonthlyExpense);

module.exports = router;