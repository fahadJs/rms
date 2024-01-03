const poolConnection = require('../../config/database');

const getPosMonthlyExpense = async (req, res) => {
    const {restaurantId} = req.params;
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
    res.json({data});
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterMonthlyExpense = async (req, res) => {
    const {restaurantId} = req.params;
    try {
        const query = `
        SELECT 
        DATE_FORMAT(o.time, '%b') AS name,
        SUM(oi.Price * oi.Quantity) AS Expense,
        SUM(o.total_amount) AS Income
      FROM orders o
      JOIN order_items oi ON o.OrderID = oi.OrderID
      WHERE o.restaurant_id = ?
      GROUP BY name
      ORDER BY name;
    `;
        const data = await poolConnection.query(query, [restaurantId]);
    res.json({data});
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    getPosMonthlyExpense,
    getWaiterMonthlyExpense
}