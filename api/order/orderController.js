const poolConnection = require('../../config/database');

const create = async (req, res) => {


    try {
        await poolConnection.query('START TRANSACTION');

        const { waiter_id, table_id, items, total_amount } = req.body;
        const { id } = req.params;

        // Step 2: Insert into orders table
        const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, status, total_amount, restaurant_id) VALUES (?, ?, NOW(), ?, ?, ?)';
        const orderValues = [waiter_id, table_id, 'Pending', total_amount, id];
        const orderResult = await poolConnection.query(orderInsertQuery, orderValues);

        const orderID = orderResult.insertId;

        // Step 3: Insert into order_items table for each item
        const orderItemsInsertQuery = 'INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(orderItemsInsertQuery, orderItemsValues);
        }

        // Step 4: Commit transaction
        await poolConnection.query('COMMIT');

        res.status(201).json({ message: 'Order created successfully!' });
    } catch (error) {
        // Step 5: Rollback transaction on error
        if (poolConnection) {
            await poolConnection.query('ROLLBACK');
        }

        console.error(`Error creating order! Error: ${error}`);
        res.status(500).json({ error: 'Error creating order!' });
    }
}

module.exports = {
    create
}