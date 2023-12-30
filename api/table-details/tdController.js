const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const tableId = req.params.id;

        const query = `
        SELECT
            orders.OrderID,
            orders.waiter_id,
            orders.table_id,
            orders.time,
            orders.order_status,
            orders.bill_status,
            orders.total_amount,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'MenuItemID', order_items.MenuItemID,
                'ItemName', order_items.ItemName,
                'Price', order_items.Price,
                'Quantity', order_items.Quantity,
                'KitchenID', order_items.KitchenID,
                'CategoryID', order_items.CategoryID,
                'Note', order_items.Note
              )
            ) AS items
        FROM
            orders
        JOIN
            order_items ON orders.OrderID = order_items.OrderID
        WHERE
            orders.table_id = ? AND orders.order_status != 'paid'
        GROUP BY
            orders.OrderID;
      `;

        const result = await poolConnection.query(query, [tableId]);

        if (result.length == 0) {
            res.status(200).json({status: 200, message: "Table is already PAID and AVAILABLE!" });
        } else {
            const formattedResult = result.map(order => ({
                ...order,
                items: JSON.parse(order.items)
            }));

            res.status(200).json(formattedResult);
        }

    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error while fetching order details!'});
    }
};

const removeItem = async (req, res) => {
    try {
        const { orderId, menuItemId } = req.params;

        // Start a transaction
        await poolConnection.query('START TRANSACTION');

        // Check if the order exists
        const checkOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const checkOrderResult = await poolConnection.query(checkOrderQuery, [orderId]);

        if (checkOrderResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({status: 404, message: 'Order not found!' });
        }

        // Check if the item exists in the order
        const checkItemQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        const checkItemResult = await poolConnection.query(checkItemQuery, [orderId, menuItemId]);

        if (checkItemResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({status: 404, message: 'Item not found in the order!' });
        }

        // Get the quantity of the item being removed
        const removedItemQuantity = checkItemResult[0].Quantity;

        // Remove the item from the order_items table
        const removeItemQuery = 'DELETE FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        await poolConnection.query(removeItemQuery, [orderId, menuItemId]);

        // Update the on_hand value in the inventory table
        const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
        await poolConnection.query(updateInventoryQuery, [removedItemQuantity, menuItemId]);

        // Check if there are no more items left in the order
        const remainingItemsQuery = 'SELECT * FROM order_items WHERE OrderID = ?';
        const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);

        if (remainingItemsResult.length === 0) {
            // If no remaining items, delete the order
            const deleteOrderQuery = 'DELETE FROM orders WHERE OrderID = ?';
            await poolConnection.query(deleteOrderQuery, [orderId]);

            const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = ?';
            await poolConnection.query(updateTableQuery, [checkOrderResult[0].table_id]);
        }

        // Commit the transaction
        await poolConnection.query('COMMIT');

        res.status(200).json({status: 200, message: 'Item removed from the order successfully!' });

    } catch (error) {
        // Rollback the transaction in case of an error
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error removing item from the order!'});
    }
}

const updateItemQuantity = async (req, res) => {
    try {
        const { orderId, menuItemId, receivedQuantity, receivedPrice } = req.params;

        // Start a transaction
        await poolConnection.query('START TRANSACTION');

        // Check if the order exists
        const checkOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const checkOrderResult = await poolConnection.query(checkOrderQuery, [orderId]);

        if (checkOrderResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({status: 404, message: 'Order not found!' });
        }

        // Check if the item exists in the order
        const checkItemQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        const checkItemResult = await poolConnection.query(checkItemQuery, [orderId, menuItemId]);

        if (checkItemResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({status: 404, message: 'Item not found in the order!' });
        }

        // Get the existing quantity of the item in the order
        const existingQuantity = checkItemResult[0].Quantity;

        // Update the quantity in the order_items table
        const updateQuantityQuery = 'UPDATE order_items SET Quantity = ?, Price = ? WHERE OrderID = ? AND MenuItemID = ?';
        await poolConnection.query(updateQuantityQuery, [receivedQuantity, receivedPrice, orderId, menuItemId]);

        // Calculate the quantity difference
        const quantityDifference = receivedQuantity - existingQuantity;

        if (quantityDifference > 0) {
            // If received quantity is greater, update inventory and quantity
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand - ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [quantityDifference, menuItemId]);
        } else if (quantityDifference < 0) {
            // If received quantity is less, add remaining quantity back to inventory
            const remainingQuantity = Math.abs(quantityDifference);
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [remainingQuantity, menuItemId]);
        }

        // Commit the transaction
        await poolConnection.query('COMMIT');

        res.status(200).json({status: 200, message: 'Item quantity updated successfully!'});
    } catch (error) {
        // Rollback the transaction in case of an error
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating item quantity in the order!'});
    }
};

const mrkPaid = async (req, res) => {
    try {
        const {orderId, tid, paidVia} = req.params;

        const updateOrderQuery = 'UPDATE orders SET order_status = "paid", tid = ? , paid_via = ? WHERE OrderID = ?';
        await poolConnection.query(updateOrderQuery, [orderId, tid, paidVia]);

        const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = (SELECT table_id FROM orders WHERE OrderID = ?)';
        await poolConnection.query(updateTableQuery, [orderId]);

        res.status(200).json({status: 200, message: 'Order status updated to "paid" and table status set to "available" successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating order status and table status!'});
    }
}

const cancel = async (req, res) => {
    try {
        const orderId = req.params.id;

        await poolConnection.query('START TRANSACTION');

        const getTableIdQuery = 'SELECT table_id FROM orders WHERE OrderID = ?';
        const tableIdResult = await poolConnection.query(getTableIdQuery, [orderId]);

        if (tableIdResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({status: 404, message: 'Order not found!' });
        }

        const tableId = tableIdResult[0].table_id;

        const getOrderItemsQuery = 'SELECT MenuItemID, Quantity FROM order_items WHERE OrderID = ?';
        const orderItemsResult = await poolConnection.query(getOrderItemsQuery, [orderId]);

        const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE OrderID = ?';
        await poolConnection.query(deleteOrderItemsQuery, [orderId]);

        const deleteOrderQuery = 'DELETE FROM orders WHERE OrderID = ?';
        await poolConnection.query(deleteOrderQuery, [orderId]);

        const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = ?';
        await poolConnection.query(updateTableQuery, [tableId]);

        for (const item of orderItemsResult) {
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [item.Quantity, item.MenuItemID]);
        }

        await poolConnection.query('COMMIT');

        res.status(200).json({status: 200, message: 'Order deleted successfully and table status set to "available"!' });

    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting order and updating table status!'});
    }
}

module.exports = {
    getAll,
    mrkPaid,
    cancel,
    removeItem,
    updateItemQuantity
}