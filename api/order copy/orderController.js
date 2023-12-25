const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { waiter_id, table_id, items, total_amount, time } = req.body;
        const restaurant_id = req.params.id;

        const orderInsertQuery = 'INSERT INTO orders_duplicate (waiter_id, table_id, time, total_amount, restaurant_id) VALUES (?, ?, ?, ?, ?)';
        const orderValues = [waiter_id, table_id, time, total_amount, restaurant_id];
        const orderResult = await poolConnection.query(orderInsertQuery, orderValues);

        const orderID = orderResult.insertId;

        const orderItemsInsertQuery = 'INSERT INTO order_items_duplicate (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(orderItemsInsertQuery, orderItemsValues);

            // Assuming you have an inventory table and you want to update the inventory here
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['reserved', table_id];
        await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

        await poolConnection.query('COMMIT');
        res.status(201).json({ message: 'Order created successfully!' });
    } catch (error) {
        if (poolConnection) {
            await poolConnection.query('ROLLBACK');
        }
        console.error(`Error creating order! Error: ${error}`);
        res.status(500).json({ error: 'Error creating order!' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const sql = `
            SELECT
                orders_duplicate.OrderID,
                orders_duplicate.waiter_id,
                orders_duplicate.table_id,
                orders_duplicate.time,
                orders_duplicate.order_status,
                orders_duplicate.bill_status,
                orders_duplicate.total_amount,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'OrderItemID', order_items_duplicate.OrderItemID,
                        'MenuItemID', order_items_duplicate.MenuItemID,
                        'ItemName', order_items_duplicate.ItemName,
                        'Price', order_items_duplicate.Price,
                        'Quantity', order_items_duplicate.Quantity,
                        'Note', order_items_duplicate.Note
                    )
                ) AS items
            FROM
                orders_duplicate
            JOIN
                order_items_duplicate ON orders_duplicate.OrderID = order_items_duplicate.OrderID
            GROUP BY
                orders_duplicate.OrderID;
        `;

        const result = await poolConnection.query(sql);

        const formattedResult = result.map(order => ({
            ...order,
            items: JSON.parse(order.items)
        }));

        res.status(200).json(formattedResult);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching orders!' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderSql = 'SELECT * FROM orders_duplicate WHERE OrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);

        if (!order.length) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderItemSql = 'SELECT * FROM order_items_duplicate WHERE OrderID = ?';
        const orderItems = await poolConnection.query(orderItemSql, [orderId]);

        const orderWithItems = { ...order[0], items: orderItems };

        res.status(200).json(orderWithItems);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching order!' });
    }
};

module.exports = {
    create,
    getAllOrders,
    getOrderById
};
