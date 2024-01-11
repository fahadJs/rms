const poolConnection = require('../../config/database');

const createEqSplit = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { orderId, numberOfPersons } = req.body;

        const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const orderResult = await poolConnection.query(getOrderQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({ status: 404, message: 'Order not found!' });
        }

        const fetchedOrder = orderResult[0];

        if (fetchedOrder.order_status == "paid") {
            res.status(401).json({ status: 401, message: 'Bill is already Paid!' });
            return;
        }

        const orderTotalAmount = orderResult[0].total_amount;

        const splitAmount = orderTotalAmount / numberOfPersons;

        const insertSplitQuery = 'INSERT INTO bill_split (OrderID, SplitAmount, PersonNumber) VALUES (?, ?, ?)';

        for (let i = 1; i <= numberOfPersons; i++) {
            await poolConnection.query(insertSplitQuery, [orderId, splitAmount, i]);
        }

        const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid" WHERE OrderID = ?';
        await poolConnection.query(updateOrderStatusQuery, [orderId]);

        const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['available', fetchedOrder.table_id];
        await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

        await poolConnection.query('COMMIT');
        res.status(201).json({ status: 201, message: 'Bill split successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error splitting bill! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error splitting bill!' });
    }
}

const createItSplit = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');
    
        const { orderId, tid, paidVia, items } = req.body;
    
        const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const orderResult = await poolConnection.query(getOrderQuery, [orderId]);
    
        if (orderResult.length === 0) {
            throw new Error({ status: 404, message: 'Order not found!' });
        }
    
        const fetchedOrder = orderResult[0];
    
        if (fetchedOrder.order_status === 'paid') {
            throw new Error({ status: 401, message: 'Bill is already paid!' });
        }
    
        const getItemDetailsQuery = 'SELECT * FROM order_items WHERE OrderID = ?';
        const itemDetailsResult = await poolConnection.query(getItemDetailsQuery, [orderId]);
    
        const insertSplitItemQuery = 'INSERT INTO bill_split_item (OrderID, MenuItemID, ItemName, SplitAmount, tid, paid_via, SplitQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        const updateOrderItemQuantityQuery = 'UPDATE order_items SET split_quantity = ?, split_status = CASE WHEN split_quantity = ? THEN "splitted" ELSE status END WHERE OrderID = ? AND MenuItemID = ?';

        const updateRemainingQuery = `UPDATE orders SET remaining = ? WHERE OrderID = ?`;
    
        for (const item of items) {
            const itemDetails = itemDetailsResult.find(details => details.MenuItemID === item.menuitemID);
    
            if (itemDetails) {
                const itemTotal = itemDetails.Price;
                const itemSplitAmount = (itemTotal / fetchedOrder.total_amount) * fetchedOrder.remaining;
    
                const updatedQuantity = itemDetails.split_quantity - item.quantity;
                if (updatedQuantity > 0) {
                    await poolConnection.query(updateOrderItemQuantityQuery, [updatedQuantity, updatedQuantity, orderId, item.menuitemID]);

                    await poolConnection.query(updateRemainingQuery, [itemSplitAmount, orderId]);
                } else {
                    await poolConnection.query(updateOrderItemQuantityQuery, [updatedQuantity, updatedQuantity, orderId, item.menuitemID]);
                }
    
                await poolConnection.query(insertSplitItemQuery, [orderId, item.menuitemID, itemDetails.ItemName, itemSplitAmount, tid, paidVia, item.quantity]);
            }
        }
    
        const remainingItemsQuery = 'SELECT COUNT(*) AS remainingItems FROM order_items WHERE OrderID = ? AND split_status != "splitted"';
        const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);
        const remainingItemCount = remainingItemsResult[0].remainingItems;
    
        if (remainingItemCount === 0) {
            const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid", tid = "itsplit", paid_via = "itsplit" WHERE OrderID = ?';
            await poolConnection.query(updateOrderStatusQuery, [orderId]);
    
            const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
            const updateTableStatusValues = ['available', fetchedOrder.table_id];
            await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);
        }
    
        await poolConnection.query('COMMIT');
        res.status(201).json({ status: 201, message: 'Bill split successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error splitting bill! Error: ${error.message}`);
        res.status(500).json({ status: 500, message: `Error splitting bill! ${error.message}` });
    }
    
}

module.exports = {
    createEqSplit,
    createItSplit
}