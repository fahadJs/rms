const { getAllWithIngredients } = require('../api/recipe-items/riController');
const io = require('../app');
const poolConnection = require('../config/database');

// const orderDetails = (details) => {
//     return details;
// }

const emitOrderToKitchen = async (kitchenID) => {
    try {
        const KitchenID = kitchenID;

        const orderItems = `SELECT * FROM order_items WHERE SStatus = 'not-sent'`;
        const orderItemsRes = await poolConnection.query(orderItems);

        for (const item of orderItemsRes) {
            const itemsByStatusQuery = `SELECT * FROM order_items JOIN orders ON order_items.OrderID = orders.OrderID WHERE order_items.OrderID = ? AND order_items.KitchenID = ? AND order_items.SStatus = 'not-sent'`;
            const itemsByStatus = await poolConnection.query(itemsByStatusQuery, [item.OrderID, KitchenID]);

            const restaurant_id = itemsByStatus[0].restaurant_id;
            const waiter_id = itemsByStatus[0].waiter_id;
            const table_id = itemsByStatus[0].table_id;

            const waiterQuery = `SELECT * FROM waiters WHERE waiter_id = ?`;
            const waiterRes = await poolConnection.query(waiterQuery, [waiter_id]);

            const tableQuery = `SELECT table_name FROM tables WHERE table_id = ?`;
            const tableRes = await poolConnection.query(tableQuery, [table_id]);

            const tableName = `Table: ${tableRes[0].table_name}`;

            const orderID = item.OrderID;

            // If orderID doesn't exist in the orders object, create a new entry
            if (!orders[orderID]) {
                orders[orderID] = {
                    OrderID: orderID,
                    items: []
                };
            }

            // Push item details to the items array of the respective orderID
            orders[orderID].items.push({
                // Add relevant item details here, for example:
                name: item.ItemName,
                price: item.Price,
                quantity: item.Quantity,
                // etc.
            });
        }

        // Convert the orders object to an array of order objects
        const orderList = Object.values(orders);
        io.emit(kitchenID, orderList);

    } catch (error) {
    // await poolConnection.query('ROLLBACK');
    console.log(`Error! ${error.message}`);
    // res.status(500).json({ status: 500, message: error.message });
}
};

module.exports = {
    emitOrderToKitchen,
};
