const poolConnection = require('../../config/database');

const getPosMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            DATE_FORMAT(po.time, '%b') AS month,
            SUM(poi.Quantity * mi.CostPrice) AS Expense,
            SUM(po.total_amount) AS Income
        FROM 
            pos_orders po
            JOIN pos_order_items poi ON po.PosOrderID = poi.PosOrderID
            JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
        WHERE 
            po.restaurant_id = ?
        GROUP BY 
            month
        ORDER BY 
            month, Expense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const formattedData = data.map(row => ({
            name: row.month,
            Expense: parseFloat(row.Expense.toFixed(2)),
            Income: parseFloat(row.Income.toFixed(2))
        }));

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getPosWeeklyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            CONCAT(YEAR(po.time), '-', WEEK(po.time)) AS week,
            SUM(poi.Quantity * mi.CostPrice) AS Expense,
            SUM(po.total_amount) AS Income
        FROM 
            pos_orders po
            JOIN pos_order_items poi ON po.PosOrderID = poi.PosOrderID
            JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
        WHERE 
            po.restaurant_id = ?
        GROUP BY 
            week
        ORDER BY 
            week, Expense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const formattedData = data.map(row => ({
            name: row.week,
            Expense: parseFloat(row.Expense.toFixed(2)),
            Income: parseFloat(row.Income.toFixed(2))
        }));

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching weekly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getPosDailyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            DATE(po.time) AS day,
            SUM(poi.Quantity * mi.CostPrice) AS Expense,
            SUM(po.total_amount) AS Income
        FROM 
            pos_orders po
            JOIN pos_order_items poi ON po.PosOrderID = poi.PosOrderID
            JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
        WHERE 
            po.restaurant_id = ?
        GROUP BY 
            day
        ORDER BY 
            day, Expense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const formattedData = data.map(row => ({
            name: row.day,
            Expense: parseFloat(row.Expense.toFixed(2)),
            Income: parseFloat(row.Income.toFixed(2))
        }));

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching daily report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterMonthlyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            DATE_FORMAT(o.time, '%b') AS month,
            SUM(oi.Quantity * mi.CostPrice) AS ItemExpense,
            SUM(oi.Price) AS TotalIncome
        FROM 
            orders o
            JOIN order_items oi ON o.OrderID = oi.OrderID
            JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
        WHERE 
            o.restaurant_id = ?
        GROUP BY 
            month
        ORDER BY 
            month, ItemExpense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const formattedData = data.map(row => ({
            name: row.month,
            Expense: parseFloat(row.ItemExpense.toFixed(2)),
            Income: parseFloat(row.TotalIncome.toFixed(2))
        }));
    

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
    DATE_FORMAT(o.time, '%b') AS month,
    oi.ItemName,
    SUM(oi.Quantity * mi.CostPrice) AS ItemExpense,
    SUM(oi.Price) AS TotalIncome
FROM 
    orders o
    JOIN order_items oi ON o.OrderID = oi.OrderID
    JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
WHERE 
    o.restaurant_id = ?
GROUP BY 
    month, oi.ItemName
ORDER BY 
    month, ItemExpense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const nestedData = data.reduce((acc, row) => {
            const { month, ItemName, ItemExpense, TotalIncome } = row;
            acc[month] = acc[month] || [];
            acc[month].push({
                ItemName,
                ItemExpense: parseFloat(ItemExpense.toFixed(2)),
                TotalIncome: parseFloat(TotalIncome.toFixed(2)),
            });
            return acc;
        }, {});

        res.json({ nestedData });
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    getPosMonthlyExpense,
    getWaiterMonthlyExpense,
    getWaiterMonthlyExpenseAdmin
}