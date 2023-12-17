const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { waiter_id, table_id, items, total_amount } = req.body;
        const { id } = req.params;

        const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, status, total_amount, restaurant_id) VALUES (?, ?, NOW(), ?, ?, ?)';
        const orderValues = [waiter_id, table_id, 'Pending', total_amount, id];
        const orderResult = await poolConnection.query(orderInsertQuery, orderValues);

        const orderID = orderResult.insertId;

        const orderItemsInsertQuery = 'INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(orderItemsInsertQuery, orderItemsValues);
        }

        await poolConnection.query('COMMIT');
        res.status(201).json({ message: 'Order created successfully!' });
    } catch (error) {
        if (poolConnection) {
            await poolConnection.query('ROLLBACK');
        }
        console.error(`Error creating order! Error: ${error}`);
        res.status(500).json({ error: 'Error creating order!' });
    }
}

// const getAllOrders = async (req, res) => {
//     try {
//         const sql = 'SELECT * FROM orders';
//         const orders = await poolConnection.query(sql);
//         res.status(200).json(orders);
//     } catch (error) {
//         console.error(`Error executing query! Error: ${error}`);
//         res.status(500).json({ error: 'Error fetching orders!' });
//     }
// }

const getAllOrders = async (req, res) => {
    try {
        const sql = `
            SELECT
                orders.OrderID,
                orders.waiter_id,
                orders.table_id,
                orders.time,
                orders.status,
                orders.total_amount,
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
            GROUP BY
                orders.OrderID;
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
        const orderSql = 'SELECT * FROM orders WHERE OrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);

        if (!order.length) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderItemSql = 'SELECT * FROM order_items WHERE OrderID = ?';
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
}