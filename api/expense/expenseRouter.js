const router = require('express').Router();
const expenseController = require('./expenseController');

router.get('/res/:restaurantId/pos/monthly', expenseController.getPosMonthlyExpense);
router.get('/res/:restaurantId/waiter/monthly/admin', expenseController.getWaiterMonthlyExpenseAdmin);
router.get('/res/:restaurantId/waiter/monthly', expenseController.getWaiterMonthlyExpense);

module.exports = router;