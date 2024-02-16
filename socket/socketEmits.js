const poolConnection = require('../config/database');

let io;

const initializeIO = (socketIO) => {
    io = socketIO;
};

const emitOrderToKitchen = async (kitchenID) => {
    try {
        const KitchenID = kitchenID;

        const orderItems = `SELECT * FROM order_items WHERE SStatus = 'not-sent' AND KitchenID = ?`;
        const orderItemsRes = await poolConnection.query(orderItems, [KitchenID]);

        // console.log(`order: ${JSON.stringify(orderItemsRes)}`);
        const orders = {};
        for (const item of orderItemsRes) {
            const itemsByStatusQuery = `SELECT * FROM order_items JOIN orders ON order_items.OrderID = orders.OrderID WHERE order_items.OrderID = ?`;
            const itemsByStatus = await poolConnection.query(itemsByStatusQuery, [item.OrderID]);

            const restaurant_id = itemsByStatus.restaurant_id;
            const waiter_id = itemsByStatus.waiter_id;
            const table_id = itemsByStatus.table_id;

            const waiterQuery = `SELECT * FROM waiters WHERE waiter_id = ?`;
            const waiterRes = await poolConnection.query(waiterQuery, [waiter_id]);

            const tableQuery = `SELECT table_name, table_id FROM tables WHERE table_id = ?`;
            const tableRes = await poolConnection.query(tableQuery, [table_id]);

            const tableName = `Table: ${tableRes.table_name}`;

            const orderID = item.OrderID;
            const waiterName = waiterRes[0].waiter_name;
            const waiterId = waiterRes[0].waiter_id;
            const tableId = tableRes.table_id;

            if (!orders[orderID]) {
                orders[orderID] = {
                    OrderID: orderID,
                    tableID: tableId,
                    tableName: tableName,
                    waiterName: waiterName,
                    waiterID: waiterId,
                    items: []
                };
            }

            const extrasQuery = `SELECT * FROM order_extras JOIN menu_extras ON order_extras.extras_id = menu_extras.extras_id WHERE OrderItemID = ?`;
            const extrasRes = await poolConnection.query(extrasQuery, [item.OrderItemID]);

            let extras = [];
            if (extrasRes.length > 0) {
                extras = extrasRes.map(extra => ({
                    extrasName: extra.extras_name,
                    // extrasPrice: extra.extras_price
                }));
            }

            orders[orderID].items.push({
                itemId: item.OrderItemID,
                name: item.ItemName,
                quantity: item.Quantity,
                note: item.Note,
                extras: extras,
            });
        }

        const orderList = Object.values(orders);
        io.emit(kitchenID, orderList);

        console.log(`order from socket: ${JSON.stringify(orderList)}`);

    } catch (error) {
        console.log(`Error! ${error.message}`);
    }
};

module.exports = {
    emitOrderToKitchen,
    initializeIO
};