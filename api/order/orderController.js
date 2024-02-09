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

        const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status, TStatus, PStatus, split_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not-sent', 'not-sent', 'not-sent', ?)`;

        const orderExtrasInsertQuery = `INSERT INTO order_extras (OrderItemID, extras_id) VALUES (?, ?)`;

        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note, extras } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note, 0];
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

        const updateTableStatusQuery = 'UPDATE tables SET status = ?, pay_status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['reserved', 'not-vacant',table_id];
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
    
    // try {
    //     const {restaurant_id} = req.params;
    //     const sql = `
    //         SELECT
    //             orders.OrderID,
    //             orders.waiter_id,
    //             orders.table_id,
    //             orders.time,
    //             orders.order_status,
    //             orders.bill_status,
    //             orders.total_amount,
    //             orders.tid,
    //             orders.paid_via,
    //             JSON_ARRAYAGG(
    //                 JSON_OBJECT(
    //                     'OrderItemID', order_items.OrderItemID,
    //                     'MenuItemID', order_items.MenuItemID,
    //                     'ItemName', order_items.ItemName,
    //                     'Price', order_items.Price,
    //                     'Quantity', order_items.Quantity,
    //                     'Note', order_items.Note
    //                 )
    //             ) AS items
    //         FROM
    //             orders
    //         JOIN
    //             order_items ON orders.OrderID = order_items.OrderID
    //         WHERE
    //             orders.restaurant_id = ?
    //         GROUP BY
    //             orders.OrderID;
    //     `;

    //     const result = await poolConnection.query(sql, [restaurant_id]);

    //     const formattedResult = result.map(order => ({
    //         ...order,
    //         items: JSON.parse(order.items)
    //     }));

    //     res.status(200).json(formattedResult);
    // } catch (error) {
    //     console.error(`Error executing query! Error: ${error}`);
    //     res.status(500).json({ status: 500, message: 'Error fetching orders!' });
    // }


    try {
        const { restaurant_id } = req.params;
        const sql = `
            SELECT
                orders.OrderID,
                orders.waiter_id,
                orders.table_id,
                tables.table_name,
                orders.time,
                orders.order_status,
                orders.bill_status,
                orders.after_tax AS total_amount,
                orders.tid,
                orders.paid_via,
                order_items.OrderItemID,
                order_items.MenuItemID,
                order_items.ItemName,
                order_items.Price,
                order_items.Quantity,
                order_items.Note,
                menu_extras.extras_id,
                menu_extras.extras_name,
                menu_extras.extras_price,
                ROW_NUMBER() OVER () AS series
            FROM
                orders
            JOIN
                order_items ON orders.OrderID = order_items.OrderID
            LEFT JOIN
                order_extras ON order_items.OrderItemID = order_extras.OrderItemID
            LEFT JOIN
                menu_extras ON order_extras.extras_id = menu_extras.extras_id
            JOIN
                tables ON orders.table_id = tables.table_id
            WHERE
                orders.restaurant_id = ?;
        `;
    
        const result = await poolConnection.query(sql, [restaurant_id]);
    
        const orders = {};
    
        result.forEach(row => {
            const {
                OrderID,
                series,
                waiter_id,
                table_id,
                table_name,
                time,
                order_status,
                bill_status,
                total_amount,
                tid,
                paid_via,
                OrderItemID,
                MenuItemID,
                ItemName,
                Price,
                Quantity,
                Note,
                extras_id,
                extras_name,
                extras_price
            } = row;
    
            if (!orders[OrderID]) {
                orders[OrderID] = {
                    OrderID,
                    series,
                    waiter_id,
                    table_id,
                    table_name,
                    time,
                    order_status,
                    bill_status,
                    total_amount,
                    tid,
                    paid_via,
                    items: []
                };
            }
    
            const existingItem = orders[OrderID].items.find(item => item.OrderItemID === OrderItemID);
    
            if (!existingItem) {
                const newItem = {
                    OrderItemID,
                    MenuItemID,
                    ItemName,
                    Price,
                    Quantity,
                    Note,
                    Extras: []
                };
    
                if (extras_id && extras_name && extras_price) {
                    newItem.Extras.push({ extras_id, extras_name, extras_price });
                }
    
                orders[OrderID].items.push(newItem);
            } else {
                if (extras_id && extras_name && extras_price) {
                    existingItem.Extras.push({ extras_id, extras_name, extras_price });
                }
            }
        });
    
        const formattedResult = Object.values(orders);
    
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching orders!' });
    }
    
    
};

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
    
        // Query to fetch order details
        const orderSql = 'SELECT * FROM orders WHERE OrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);
    
        if (!order.length) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }
    
        // Query to fetch order items and their associated extras
        const orderItemSql = `
            SELECT
                order_items.*,
                menu_extras.extras_id,
                menu_extras.extras_name,
                menu_extras.extras_price
            FROM
                order_items
            LEFT JOIN
                order_extras ON order_items.OrderItemID = order_extras.OrderItemID
            LEFT JOIN
                menu_extras ON order_extras.extras_id = menu_extras.extras_id
            WHERE
                order_items.OrderID = ?;
        `;
    
        const orderItems = await poolConnection.query(orderItemSql, [orderId]);
    
        // Group order items and their extras
        const groupedItems = orderItems.reduce((acc, item) => {
            const foundItem = acc.find((groupedItem) => groupedItem.OrderItemID === item.OrderItemID);
    
            if (!foundItem) {
                acc.push({
                    ...item,
                    Extras: item.extras_id ? [{ extras_id: item.extras_id, extras_name: item.extras_name, extras_price: item.extras_price }] : []
                });
            } else {
                if (item.extras_id) {
                    foundItem.Extras.push({ extras_id: item.extras_id, extras_name: item.extras_name, extras_price: item.extras_price });
                }
            }
    
            return acc;
        }, []);
    
        const orderWithItemsAndExtras = { ...order[0], items: groupedItems };
    
        res.status(200).json(orderWithItemsAndExtras);
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