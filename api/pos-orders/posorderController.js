const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { total_amount, items } = req.body;
        const restaurant_id = req.params.id;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const insertOrderQuery = 'INSERT INTO pos_orders (time, total_amount, restaurant_id) VALUES (?, ?, ?)';
        const orderValues = [orderTime, total_amount, restaurant_id];
        const orderResult = await poolConnection.query(insertOrderQuery, orderValues);
        const posOrderId = orderResult.insertId;

        const insertOrderItemsQuery = `
          INSERT INTO pos_order_items (PosOrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const orderExtrasInsertQuery = `INSERT INTO pos_order_extras (PosOrderItemID, extras_id) VALUES (?, ?)`;

        for (const item of items) {
            const { menuitemID, name, price, quantity, kitchenID, categoryID, note, extras } = item;
            const orderItemsValues = [posOrderId, menuitemID, name, price, quantity, kitchenID, categoryID, note];
            const orderItemsResult = await poolConnection.query(insertOrderItemsQuery, orderItemsValues);

            const posOrderItemID = orderItemsResult.insertId;

            if (extras && extras.length > 0) {
                for (const extra of extras) {
                    const orderExtrasValues = [posOrderItemID, extra.extras_id];
                    await poolConnection.query(orderExtrasInsertQuery, orderExtrasValues);
                }
            }

            const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
            const updateInventoryValues = [quantity, menuitemID];
            await poolConnection.query(updateInventoryQuery, updateInventoryValues);
        }

        await poolConnection.query('COMMIT');
        res.status(201).json({ status: 201, message: 'POS order placed successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error placing POS order! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error placing POS order!' });
    }
}

const mrkPaid = async (req, res) => {
    try {
        const { orderId, tid, paidVia } = req.params;

        const tidValue = tid.toUpperCase();
        const paidViaValue = paidVia.toUpperCase();

        const updateOrderQuery = 'UPDATE pos_orders SET order_status = "paid", tid = ?, paid_via = ? WHERE PosOrderID = ?';
        await poolConnection.query(updateOrderQuery, [tidValue, paidViaValue, orderId]);

        res.status(200).json({ status: 200, message: 'POS Order status updated to "paid" successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error updating order status and table status!' });
    }
}

const getOrderById = async (req, res) => {
    try {
        const posOrderId = req.params.id;

        const posOrderSql = 'SELECT * FROM pos_orders WHERE PosOrderID = ?';
        const posOrder = await poolConnection.query(posOrderSql, [posOrderId]);

        if (!posOrder.length) {
            return res.status(404).json({ status: 404, message: 'POS Order not found' });
        }

        const posOrderItemSql = `
            SELECT
                pos_order_items.*,
                pos_order_extras.PosOrderExtrasID,
                menu_extras.extras_id,
                menu_extras.extras_name,
                menu_extras.extras_price
            FROM
                pos_order_items
            LEFT JOIN
                pos_order_extras ON pos_order_items.PosOrderItemID = pos_order_extras.PosOrderItemID
            LEFT JOIN
                menu_extras ON pos_order_extras.extras_id = menu_extras.extras_id
            WHERE
                pos_order_items.PosOrderID = ?;
        `;

        const posOrderItems = await poolConnection.query(posOrderItemSql, [posOrderId]);

        const groupedPosItems = posOrderItems.reduce((acc, item) => {
            const foundItem = acc.find((groupedItem) => groupedItem.PosOrderItemID === item.PosOrderItemID);

            if (!foundItem) {
                acc.push({
                    ...item,
                    Extras: item.extras_id ? [{ PosOrderExtrasID: item.PosOrderExtrasID, extras_id: item.extras_id, extras_name: item.extras_name, extras_price: item.extras_price }] : []
                });
            } else {
                if (item.extras_id) {
                    foundItem.Extras.push({ PosOrderExtrasID: item.PosOrderExtrasID, extras_id: item.extras_id, extras_name: item.extras_name, extras_price: item.extras_price });
                }
            }

            return acc;
        }, []);

        const posOrderWithItemsAndExtras = { ...posOrder[0], items: groupedPosItems };

        res.status(200).json(posOrderWithItemsAndExtras);
    } catch (error) {
        console.error(`Error executing POS order query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching POS order!' });
    }

};

const getAllOrders = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const getPosOrdersQuery = `
            SELECT 
                pos_orders.PosOrderID,
                pos_orders.time,
                pos_orders.order_status,
                pos_orders.total_amount,
                pos_orders.restaurant_id,
                pos_orders.bill_status,
                pos_orders.tid,
                pos_orders.paid_via,
                pos_order_items.PosOrderItemID,
                pos_order_items.MenuItemID,
                pos_order_items.ItemName,
                pos_order_items.Price,
                pos_order_items.Quantity,
                pos_order_items.KitchenID,
                pos_order_items.CategoryID,
                pos_order_items.Note,
                pos_order_extras.PosOrderExtrasID,
                menu_extras.extras_id,
                menu_extras.extras_name,
                menu_extras.extras_price
            FROM pos_orders
            LEFT JOIN pos_order_items ON pos_orders.PosOrderID = pos_order_items.PosOrderID
            LEFT JOIN pos_order_extras ON pos_order_items.PosOrderItemID = pos_order_extras.PosOrderItemID
            LEFT JOIN menu_extras ON pos_order_extras.extras_id = menu_extras.extras_id
            WHERE pos_orders.restaurant_id = ?

        `;

        const posResult = await poolConnection.query(getPosOrdersQuery, [restaurant_id]);

        const posOrders = {};

        posResult.forEach(row => {
            const {
                PosOrderID,
                time,
                order_status,
                total_amount,
                restaurant_id,
                bill_status,
                tid,
                paid_via,
                PosOrderItemID,
                MenuItemID,
                ItemName,
                Price,
                Quantity,
                KitchenID,
                CategoryID,
                Note,
                extras_id,
                extras_name,
                extras_price
            } = row;

            if (!posOrders[PosOrderID]) {
                posOrders[PosOrderID] = {
                    PosOrderID,
                    time,
                    order_status,
                    total_amount,
                    restaurant_id,
                    bill_status,
                    tid,
                    paid_via,
                    items: []
                };
            }

            const existingItem = posOrders[PosOrderID].items.find(item => item.PosOrderItemID === PosOrderItemID);

            if (!existingItem) {
                const newItem = {
                    PosOrderItemID,
                    MenuItemID,
                    ItemName,
                    Price,
                    Quantity,
                    KitchenID,
                    CategoryID,
                    Note,
                    Extras: []
                };

                if (extras_id && extras_name && extras_price) {
                    newItem.Extras.push({ extras_id, extras_name, extras_price });
                }

                posOrders[PosOrderID].items.push(newItem);
            } else {
                if (extras_id && extras_name && extras_price) {
                    existingItem.Extras.push({ extras_id, extras_name, extras_price });
                }
            }
        });

        const formattedPosResult = Object.values(posOrders);

        res.status(200).json(formattedPosResult);
    } catch (error) {
        console.error(`Error executing POS query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching POS orders!' });
    }

};

module.exports = {
    create,
    getAllOrders,
    getOrderById,
    mrkPaid
}