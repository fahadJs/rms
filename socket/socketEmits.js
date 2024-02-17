const poolConnection = require('../config/database');
const moment = require('moment-timezone');

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

            const restaurant_id = itemsByStatus[0].restaurant_id;
            const waiter_id = itemsByStatus[0].waiter_id;
            const table_id = itemsByStatus[0].table_id;
            const status = itemsByStatus[0].KStatus;
            const time = itemsByStatus[0].time;

            const waiterQuery = `SELECT * FROM waiters WHERE waiter_id = ?`;
            const waiterRes = await poolConnection.query(waiterQuery, [waiter_id]);

            const tableQuery = `SELECT * FROM tables WHERE table_id = ?`;
            const tableRes = await poolConnection.query(tableQuery, [table_id]);

            const tableName = `Table: ${tableRes[0].table_name}`;

            const orderID = item.OrderID;
            const waiterName = waiterRes[0].waiter_name;
            // const waiterId = waiterRes[0].waiter_id;
            // const tableId = tableRes.table_id;

            if (!orders[orderID]) {
                orders[orderID] = {
                    OrderID: orderID,
                    tableID: table_id,
                    tableName: tableName,
                    waiterName: waiterName,
                    waiterID: waiter_id,
                    status: status,
                    time: time,
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
        io.emit('getKitchenID', orderList);

        // console.log(`order from socket: ${JSON.stringify(orderList)}`);

    } catch (error) {
        console.log(`Error! ${error.message}`);
    }
};

const orderStatusUpdate = async (orderData) => {
    try {
        const { orderID, kitchenID, time, restaurantID } = orderData;

        const updateOrderItemsKitchenStatus = `UPDATE order_items SET KStatus = ? WHERE OrderID = ? AND KitchenID = ?`;
        await poolConnection.query(updateOrderItemsKitchenStatus, ['COMPLETED', orderID, kitchenID]);

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurantID]);

        const timeZone = timeZoneResult[0].time_zone;
        const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const insertKitchenTimeLog = `INSERT INTO kitchens_log (time_diff, log_time, OrderID, KitchenID) VALUES (?, ?, ?, ?)`;
        await poolConnection.query(insertKitchenTimeLog, [time, orderTime, orderID, kitchenID]);
    } catch (error) {
        console.log(`Error! ${error.message}`);
    }
}

module.exports = {
    emitOrderToKitchen,
    initializeIO,
    orderStatusUpdate
};