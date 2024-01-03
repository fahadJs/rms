const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { waiter_id, table_id, items, total_amount } = req.body;
        const restaurant_id = req.params.id;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, total_amount, restaurant_id, tid, paid_via) VALUES (?, ?, ?, ?, ?)';
        const orderValues = [waiter_id, table_id, orderTime, total_amount, restaurant_id, 'un-paid', 'un-paid'];
        const orderResult = await poolConnection.query(orderInsertQuery, orderValues);

        const orderID = orderResult.insertId;

        const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not-sent')`;
        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note } = item;
            const orderItemsValues = [orderID, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            await poolConnection.query(orderItemsInsertQuery, orderItemsValues);


            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
        const updateTableStatusValues = ['reserved', table_id];
        await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

        await poolConnection.query('COMMIT');

        // // Fetch kitchen information
        // const kitchenInfoQuery = `
        // SELECT wc.instance_id, wi.access_token, wi.instance_number, wgi.w_group_number
        // FROM w_message_connection wc
        // JOIN WhatsAppInstances wi ON wc.instance_id = wi.instance_id
        // JOIN WGroupIds wgi ON wc.w_group_id = wgi.w_group_id
        // WHERE wc.KitchenID = ?`;
        // const kitchenInfo = await query(kitchenInfoQuery, [kitchenID]);
        // console.log(kitchenInfo);

        // if (kitchenInfo.length > 0) {
        //     const instanceID = kitchenInfo[0].instance_name;
        //     const accessToken = kitchenInfo[0].access_token;
        //     const instanceNumber = kitchenInfo[0].instance_number;
        //     const group_id = kitchenInfo[0].w_group_name;
        //     // Prepare message
        //     const message = `New order for table ${table_id} from waiter ${waiter_id}. Total: ${total_amount}.`;

        //     // Prepare the URL
        //     const apiUrl = `https://dash3.wabot.my/api/sendgroupmsg.php?group_id=${group_id}&type=text&message=${encodeURIComponent(message)}&instance_id=${instanceNumber}&access_token=${accessToken}`;

        //     // Send message to the kitchen
        //     const response = await axios.post(apiUrl);
        //     console.log(`Message sent to kitchen. Response: ${JSON.stringify(response.data)}`);
        // }

        res.status(201).json({ status: 201, message: 'Order created successfully!' });
    } catch (error) {
        if (poolConnection) {
            await poolConnection.query('ROLLBACK');
        }
        console.error(`Error creating order! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error creating order!' });
    }
}

const getAllOrders = async (req, res) => {
    try {
        const sql = `
            SELECT
                orders.OrderID,
                orders.waiter_id,
                orders.table_id,
                orders.time,
                orders.order_status,
                orders.bill_status,
                orders.total_amount,
                orders.tid,
                orders.paid_via,
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
        res.status(500).json({ status: 500, message: 'Error fetching orders!' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderSql = 'SELECT * FROM orders WHERE OrderID = ?';
        const order = await poolConnection.query(orderSql, [orderId]);

        if (!order.length) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        const orderItemSql = 'SELECT * FROM order_items WHERE OrderID = ?';
        const orderItems = await poolConnection.query(orderItemSql, [orderId]);

        const orderWithItems = { ...order[0], items: orderItems };

        res.status(200).json(orderWithItems);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching order!' });
    }
};



module.exports = {
    create,
    getAllOrders,
    getOrderById
}