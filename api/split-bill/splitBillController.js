const poolConnection = require('../../config/database');

const createEqSplit = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { orderId, numberOfPersons } = req.body;

        // Fetch order details
        const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const orderResult = await poolConnection.query(getOrderQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({status: 404, message: 'Order not found!' });
        }

        const fetchedOrder = orderResult[0];

        if (fetchedOrder.order_status == "paid") {
            res.status(401).json({status: 401, message: 'Bill is already Paid!' });
            return;
        }

        const orderTotalAmount = orderResult[0].total_amount;

        // Calculate split amount
        const splitAmount = orderTotalAmount / numberOfPersons;

        // Insert split details into split_bill table
        const insertSplitQuery = 'INSERT INTO bill_split (OrderID, SplitAmount, PersonNumber, SplitType) VALUES (?, ?, ?, ?)';

        for (let i = 1; i <= numberOfPersons; i++) {
            await poolConnection.query(insertSplitQuery, [orderId, splitAmount, i, 'eqsplit']);
        }

        const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid" WHERE OrderID = ?';
        await poolConnection.query(updateOrderStatusQuery, [orderId]);

        const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['available', fetchedOrder.table_id];
        await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

        await poolConnection.query('COMMIT');
        res.status(201).json({status: 201, message: 'Bill split successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error splitting bill! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error splitting bill!' });
    }
}

const createItSplit = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { orderId, items } = req.body;

        // Fetch order details
        const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const orderResult = await poolConnection.query(getOrderQuery, [orderId]);

        if (orderResult.length === 0) {
            throw new Error({status: 404, message: 'Order not found!'});
        }

        const fetchedOrder = orderResult[0];

        if (fetchedOrder.order_status === 'paid') {
            throw new Error({status: 401, message: 'Bill is already paid!'});
        }

        // Fetch item details from order_items table
        const getItemDetailsQuery = 'SELECT * FROM order_items WHERE OrderID = ?';
        const itemDetailsResult = await poolConnection.query(getItemDetailsQuery, [orderId]);

        // Calculate and insert split amounts
        const insertSplitItemQuery = 'INSERT INTO bill_split_item (OrderID, MenuItemID, ItemName, SplitAmount) VALUES (?, ?, ?, ?)';
        const updateOrderItemQuantityQuery = 'UPDATE order_items SET Quantity = ? WHERE OrderID = ? AND MenuItemID = ?';
        const deleteOrderItemQuery = 'DELETE FROM order_items WHERE OrderID = ? AND MenuItemID = ?';

        for (const item of items) {
            const itemDetails = itemDetailsResult.find(details => details.MenuItemID === item.menuitemID);

            if (itemDetails) {
                const itemTotal = itemDetails.Price;
                const itemSplitAmount = (itemTotal / fetchedOrder.total_amount) * item.quantity;

                // Update order_items quantity
                const updatedQuantity = itemDetails.Quantity - item.quantity;
                if (updatedQuantity > 0) {
                    await poolConnection.query(updateOrderItemQuantityQuery, [updatedQuantity, orderId, item.menuitemID]);
                } else {
                    // If quantity becomes zero, delete the record
                    await poolConnection.query(deleteOrderItemQuery, [orderId, item.menuitemID]);
                }

                // Insert into bill_split_item table
                await poolConnection.query(insertSplitItemQuery, [orderId, item.menuitemID, itemDetails.ItemName, itemSplitAmount]);
            }
        }

        // Check if there are any remaining items in order_items
        const remainingItemsQuery = 'SELECT COUNT(*) AS remainingItems FROM order_items WHERE OrderID = ?';
        const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);
        const remainingItemCount = remainingItemsResult[0].remainingItems;

        if (remainingItemCount === 0) {
            // If no remaining items, update order status to "paid" and table status to "available"
            const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid" WHERE OrderID = ?';
            await poolConnection.query(updateOrderStatusQuery, [orderId]);

            const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
            const updateTableStatusValues = ['available', fetchedOrder.table_id];
            await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);
        }

        await poolConnection.query('COMMIT');
        res.status(201).json({status: 201, message: 'Bill split successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error splitting bill! Error: ${error.message}`);
        res.status(500).json({status: 500, message: `Error splitting bill! ${error.message}` });
    }
}

module.exports = {
    createEqSplit,
    createItSplit
}