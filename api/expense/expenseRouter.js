const router = require('express').Router();
const expenseController = require('./expenseController');

router.get('/res/:restaurantId/pos/monthly', expenseController.getPosMonthlyExpense);
router.get('/res/:restaurantId/pos/weekly', expenseController.getPosWeeklyExpense);
router.get('/res/:restaurantId/pos/daily', expenseController.getPosDailyExpense);

router.get('/res/:restaurantId/waiter/monthly/admin', expenseController.getWaiterMonthlyExpenseAdmin);
router.get('/res/:restaurantId/waiter/weekly/admin', expenseController.getWaiterWeeklyExpenseAdmin);
router.get('/res/:restaurantId/waiter/daily/admin', expenseController.getWaiterDailyExpenseAdmin);

router.get('/res/:restaurantId/waiter/monthly', expenseController.getWaiterMonthlyExpense);
router.get('/res/:restaurantId/waiter/weekly', expenseController.getWaiterWeeklyExpense);
router.get('/res/:restaurantId/waiter/daily', expenseController.getWaiterDailyExpense);

module.exports = router;