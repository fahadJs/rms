const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { time, total_amount, items } = req.body;
        const restaurant_id = req.params.id;

        const insertOrderQuery = 'INSERT INTO pos_orders (time, total_amount, restaurant_id) VALUES (?, ?, ?)';
        const orderValues = [time, total_amount, restaurant_id];
        const orderResult = await poolConnection.query(insertOrderQuery, orderValues);
        const posOrderId = orderResult.insertId;

        const insertOrderItemsQuery = `
          INSERT INTO pos_order_items (PosOrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [posOrderId, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(insertOrderItemsQuery, orderItemsValues);

            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        await poolConnection.query('COMMIT');
        res.status(201).json({status: 201, message: 'POS order placed successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error placing POS order! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error placing POS order!' });
    }
}

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderSql = 'SELECT * FROM pos_orders WHERE PosOrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);

        if (!order.length) {
            return res.status(404).json({status: 404, message: 'Order not found' });
        }

        const orderItemSql = 'SELECT * FROM pos_order_items WHERE PosOrderID = ?';
        const orderItems = await poolConnection.query(orderItemSql, [orderId]);

        const orderWithItems = { ...order[0], items: orderItems };

        res.status(200).json(orderWithItems);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching order!' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const getOrdersQuery = `
            SELECT 
                pos_orders.PosOrderID,
                pos_orders.time,
                pos_orders.order_status,
                pos_orders.total_amount,
                pos_orders.restaurant_id,
                pos_orders.bill_status,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'PosOrderItemID', pos_order_items.PosOrderItemID,
                        'MenuItemID', pos_order_items.MenuItemID,
                        'ItemName', pos_order_items.ItemName,
                        'Price', pos_order_items.Price,
                        'Quantity', pos_order_items.Quantity,
                        'KitchenID', pos_order_items.KitchenID,
                        'CategoryID', pos_order_items.CategoryID,
                        'Note', pos_order_items.Note,
                        'Status', pos_order_items.Status
                    )
                ) AS order_items
            FROM pos_orders
            JOIN pos_order_items ON pos_orders.PosOrderID = pos_order_items.PosOrderID
            GROUP BY pos_orders.PosOrderID;
        `;

        const result = await poolConnection.query(getOrdersQuery);
        const ordersData = result.map(row => ({
            PosOrderID: row.PosOrderID,
            time: row.time,
            order_status: row.order_status,
            total_amount: row.total_amount,
            restaurant_id: row.restaurant_id,
            bill_status: row.bill_status,
            order_items: JSON.parse(row.order_items),
        }));

        res.status(200).json(ordersData);
    } catch (error) {
        console.error(`Error fetching POS orders! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching POS orders!' });
    }

};

module.exports = {
    create,
    getAllOrders,
    getOrderById
}