const poolConnection = require('../../config/database');

const getPosMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
        DATE_FORMAT(po.time, '%b') AS name,
        SUM(poi.Price * poi.Quantity) AS Expense,
        SUM(po.total_amount) AS Income
      FROM pos_orders po
      JOIN pos_order_items poi ON po.PosOrderID = poi.PosOrderID
      WHERE po.restaurant_id = ?
      GROUP BY name
      ORDER BY name;
    `;
        const data = await poolConnection.query(query, [restaurantId]);
        res.json({ data });
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
        res.json({ data });
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    getPosMonthlyExpense,
    getWaiterMonthlyExpense
}