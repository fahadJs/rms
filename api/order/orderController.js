const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { waiter_id, table_id, items, total_amount } = req.body;
        const restaurant_id = req.params.id;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, total_amount, restaurant_id, tid, paid_via, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const orderValues = [waiter_id, table_id, orderTime, total_amount, restaurant_id, 'un-paid', 'un-paid', total_amount];
        const orderResult = await poolConnection.query(orderInsertQuery, orderValues);

        const orderID = orderResult.insertId;

        const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not-sent')`;

        const orderExtrasInsertQuery = `INSERT INTO order_extras (OrderItemID, extras_id) VALUES (?, ?)`;

        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note, extras } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            const orderItemsResult = await poolConnection.query(orderItemsInsertQuery, orderItemsValues);

            const orderItemID = orderItemsResult.insertId;

            if (extras && extras.length > 0) {
                for (const extra of extras) {
                    const orderExtrasValues = [orderItemID, extra.extras_id];
                    await poolConnection.query(orderExtrasInsertQuery, orderExtrasValues);
                }
            }

            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['reserved', table_id];
        await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

        await poolConnection.query('COMMIT');

        res.status(201).json({ status: 201, message: 'Order created successfully!' });
    } catch (error) {
        if (poolConnection) {
            await poolConnection.query('ROLLBACK');
        }
        console.error(`Error creating order! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error creating order!' });
    }
}

const getAllOrders = async (req, res) => {
    const {restaurant_id} = req.params;
    try {
        const sql = `
            SELECT
                orders.OrderID,
                orders.waiter_id,
                orders.table_id,
                orders.time,
                orders.order_status,
                orders.bill_status,
                orders.total_amount,
                orders.tid,
                orders.paid_via,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'OrderItemID', order_items.OrderItemID,
                        'MenuItemID', order_items.MenuItemID,
                        'ItemName', order_items.ItemName,
                        'Price', order_items.Price,
                        'Quantity', order_items.Quantity,
                        'Note', order_items.Note
                    )
                ) AS items
            FROM
                orders
            JOIN
                order_items ON orders.OrderID = order_items.OrderID
            WHERE
                orders.restaurant_id = ?
            GROUP BY
                orders.OrderID;
        `;

        const result = await poolConnection.query(sql, [restaurant_id]);

        const formattedResult = result.map(order => ({
            ...order,
            items: JSON.parse(order.items)
        }));

        res.status(200).json(formattedResult);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching orders!' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderSql = 'SELECT * FROM orders WHERE OrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);

        if (!order.length) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        const orderItemSql = 'SELECT * FROM order_items WHERE OrderID = ?';
        const orderItems = await poolConnection.query(orderItemSql, [orderId]);

        const orderWithItems = { ...order[0], items: orderItems };

        res.status(200).json(orderWithItems);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching order!' });
    }
};



module.exports = {
    create,
    getAllOrders,
    getOrderById
}