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
            res.status(200).json({ message: "Table is already PAID and AVAILABLE!" });
        } else {
            const formattedResult = result.map(order => ({
                ...order,
                items: JSON.parse(order.items)
            }));

            res.status(200).json(formattedResult);
        }

    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching order details!');
    }
};

const mrkPaid = async (req, res) => {
    try {
        const orderId = req.params.id;

        const updateOrderQuery = 'UPDATE orders SET order_status = "paid" WHERE OrderID = ?';
        await poolConnection.query(updateOrderQuery, [orderId]);

        const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = (SELECT table_id FROM orders WHERE OrderID = ?)';
        await poolConnection.query(updateTableQuery, [orderId]);

        res.status(200).json({ message: 'Order status updated to "paid" and table status set to "available" successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error updating order status and table status!');
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
            return res.status(404).json({ message: 'Order not found!' });
        }

        const tableId = tableIdResult[0].table_id;

        const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE OrderID = ?';
        await poolConnection.query(deleteOrderItemsQuery, [orderId]);

        const deleteOrderQuery = 'DELETE FROM orders WHERE OrderID = ?';
        await poolConnection.query(deleteOrderQuery, [orderId]);

        const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = ?';
        await poolConnection.query(updateTableQuery, [tableId]);

        await poolConnection.query('COMMIT');

        res.status(200).json({ message: 'Order deleted successfully and table status set to "available"!' });
        
    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error deleting order and updating table status!');
    }
}

module.exports = {
    getAll,
    mrkPaid,
    cancel
}