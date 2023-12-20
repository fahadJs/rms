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
          INSERT INTO pos_order_items (PosOrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [posOrderId, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(insertOrderItemsQuery, orderItemsValues);

            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        await poolConnection.query('COMMIT');
        res.status(201).json({ message: 'POS order placed successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error placing POS order! Error: ${error}`);
        res.status(500).json({ error: 'Error placing POS order!' });
    }
}

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
    
        const getOrderByIDQuery = `
          SELECT pos_orders.PosOrderID, pos_orders.time, pos_orders.order_status, pos_orders.total_amount,
                 pos_orders.restaurant_id, pos_orders.bill_status, pos_order_items.*
          FROM pos_orders
          JOIN pos_order_items ON pos_orders.PosOrderID = pos_order_items.PosOrderID
          WHERE pos_orders.PosOrderID = ?;
        `;
    
        const result = await poolConnection.query(getOrderByIDQuery, [orderId]);
    
        if (result.length > 0) {
          const orderData = {
            PosOrderID: result[0].PosOrderID,
            time: result[0].time,
            order_status: result[0].order_status,
            total_amount: result[0].total_amount,
            restaurant_id: result[0].restaurant_id,
            bill_status: result[0].bill_status,
            order_item: {
              PosOrderItemID: result[0].PosOrderItemID,
              MenuItemID: result[0].MenuItemID,
              ItemName: result[0].ItemName,
              Price: result[0].Price,
              Quantity: result[0].Quantity,
              KitchenID: result[0].KitchenID,
              CategoryID: result[0].CategoryID,
              Note: result[0].Note,
              Status: result[0].Status,
            },
          };
    
          res.status(200).json(orderData);
        } else {
          res.status(404).json({ message: 'Order not found' });
        }
      } catch (error) {
        console.error(`Error fetching POS order by ID! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching POS order by ID!' });
      }
};

const getAllOrders = async (req, res) => {
    try {
        const getOrdersQuery = `
          SELECT pos_orders.PosOrderID, pos_orders.time, pos_orders.order_status, pos_orders.total_amount,
                 pos_orders.restaurant_id, pos_orders.bill_status, pos_order_items.*
          FROM pos_orders
          JOIN pos_order_items ON pos_orders.PosOrderID = pos_order_items.PosOrderID
        `;

        const result = await poolConnection.query(getOrdersQuery);
        const ordersData = result.map(row => ({
            PosOrderID: row.PosOrderID,
            time: row.time,
            order_status: row.order_status,
            total_amount: row.total_amount,
            restaurant_id: row.restaurant_id,
            bill_status: row.bill_status,
            order_item: {
                PosOrderItemID: row.PosOrderItemID,
                MenuItemID: row.MenuItemID,
                ItemName: row.ItemName,
                Price: row.Price,
                Quantity: row.Quantity,
                KitchenID: row.KitchenID,
                CategoryID: row.CategoryID,
                Note: row.Note,
                Status: row.Status,
            },
        }));

        res.status(200).json(ordersData);
    } catch (error) {
        console.error(`Error fetching POS orders! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching POS orders!' });
    }
};



module.exports = {
    create,
    getAllOrders,
    getOrderById
}