const router = require('express').Router();
const expenseController = require('./expenseController');

router.get('/res/:restaurantId/pos/monthly', expenseController.getPosMonthlyExpense);
router.get('/res/:restaurantId/pos/weekly', expenseController.getPosWeeklyExpense);
router.get('/res/:restaurantId/pos/daily', expenseController.getPosDailyExpense);

router.get('/res/:restaurantId/waiter/monthly/admin', expenseController.getWaiterMonthlyExpenseAdmin);
router.get('/res/:restaurantId/waiter/weekly/admin', expenseController.getWaiterWeeklyExpenseAdmin);
router.get('/res/:restaurantId/waiter/daily/admin', expenseController.getWaiterDailyExpenseAdmin);

module.exports = router;