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
            res.status(200).json({message: "Table is already PAID and AVAILABLE!"});
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
}

module.exports = {
    getAll
}