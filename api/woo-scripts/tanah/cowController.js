const poolConnection = require('../../../config/database');
const axios = require('axios');
const moment = require('moment-timezone');

const getAllOrders = async (req, res) => {
    // try {
    //     const apiUrl = 'https://anunziointernational.com/tanah/wp-json/wc/v3/orders';
    //     const consumerKey = 'ck_d02faf8414ff73ce9be2c97df738aa4419d65266';
    //     const consumerSecret = 'cs_b335e4e1ea326c697cee0079271870d197477b4d';

    //     const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    //     axios.get(apiUrl, {
    //         headers: {
    //             Authorization: `Basic ${authString}`,
    //             'Content-Type': 'application/json',
    //         },
    //     })
    //         .then(response => {
    //             poolConnection.query('START TRANSACTION');

    //             const order = response.data;

    //             const nonCompletedOrders = order.filter(order => order.status !== 'completed');

    //             nonCompletedOrders.forEach(order => {
    //                 // For Order
    //                 if (order.coupon_lines.length > 0) {
    //                     const coupon = order.coupon_lines[0];
    //                     console.log(coupon);
    //                     tableId = coupon.code;
    //                 }
    //                 let tableId = 0
    //                 const totalAmount = order.total;
    //                 const restaurantId = 3;
    //                 const tId = 'un-paid';
    //                 const paidVia = 'un-paid';            
    //                 const orderId = order.id;

    //                 const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
    //                 const timeZoneResult = poolConnection.query(timeZoneQuery, [restaurantId]);

    //                 const timeZone = timeZoneResult[0].time_zone;
    //                 const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

    //                 const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, total_amount, restaurant_id, tid, paid_via, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    //                 const orderValues = [1, tableId, orderTime, totalAmount, restaurantId, 'un-paid', 'un-paid', totalAmount];
    //                 const orderResult = poolConnection.query(orderInsertQuery, orderValues);

    //                 const orderInsertID = orderResult.insertId;

    //                 const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status, TStatus, PStatus, split_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not-sent', 'not-sent', 'not-sent', ?)`;

    //                 order.line_items.forEach(item => {
    //                     // For OrderItems
    //                     const MenuItemID = 34;
    //                     const itemName = item.name;
    //                     const price = item.subtotal;
    //                     const quantity = item.quantity;
    //                     let kitchenId = 1

    //                     const sku = item.sku;
    //                     const trimmedSku = sku.substring(sku.indexOf('k') + 1);
    //                     console.log('Trimmed SKU:', trimmedSku);

    //                     if (trimmedSku == '1') {
    //                         kitchenId = 10;
    //                     }
    //                     if (trimmedSku == '2') {
    //                         kitchenId = 9;
    //                     }
    //                     const categoryId = 1;

    //                     console.log(`
    //                     table: ${tableId}
    //                     total: ${totalAmount}
    //                     restaurant: ${restaurantId}
    //                     tid: ${tId}
    //                     paidVia: ${paidVia}

    //                     menuitem: ${MenuItemID}
    //                     item: ${itemName}
    //                     price: ${price}
    //                     quantity: ${quantity}
    //                     kitchen: ${kitchenId}
    //                     category: ${categoryId}`);

    //                     const orderItemsValues = [orderInsertID, MenuItemID, itemName, price, quantity, kitchenId, categoryId, quantity];
    //                     const orderItemsResult = poolConnection.query(orderItemsInsertQuery, orderItemsValues);
    //                 });

    //                 const updateTableStatusQuery = 'UPDATE tables SET status = ?, pay_status = ? WHERE table_id = ?';
    //                 const updateTableStatusValues = ['reserved', 'not-vacant', tableId];
    //                 poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

    //                 const updatedOrderStatus = 'completed';
    //                 const updateOrderStatusUrl = `https://anunziointernational.com/tanah/wp-json/wc/v3/orders/${orderId}`;

    //                 axios.put(updateOrderStatusUrl, {
    //                     status: updatedOrderStatus,
    //                 }, {
    //                     headers: {
    //                         Authorization: `Basic ${authString}`,
    //                         'Content-Type': 'application/json',
    //                     },
    //                 })
    //                     .then(response => {
    //                         console.log(`Order ${orderId} status updated successfully!`);
    //                     })
    //                     .catch(error => {
    //                         console.error(`Error updating order ${orderId} status:`, error.message);
    //                     });
    //             });

    //             poolConnection.query('COMMIT');
    //             res.json({ status: 200, message: 'done!' });
    //         })
    //         .catch(error => {
    //             console.error('Error fetching data:', error.message);
    //         });
    // } catch (error) {
    //     await poolConnection.query('ROLLBACK');
    //     console.log(`Error! Fetching Orders! ${error}`);
    //     res.status(500).json({ status: 500, message: 'Internal Server Error!' });
    // }

    try {
        const apiUrl = 'https://anunziointernational.com/tanah/wp-json/wc/v3/orders';
        const consumerKey = 'ck_d02faf8414ff73ce9be2c97df738aa4419d65266';
        const consumerSecret = 'cs_b335e4e1ea326c697cee0079271870d197477b4d';

        const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Basic ${authString}`,
                'Content-Type': 'application/json',
            },
        });

        await poolConnection.query('START TRANSACTION');

        const orders = response.data;

        // console.log(orders);

        for (const order of orders) {
            if (order.status === 'completed') {
                continue;
            }

            let tableId = 1;
            if (order.coupon_lines.length > 0) {
                const coupon = order.coupon_lines[0];
                tableId = coupon.code;
            }

            // console.log(tableId);
            // console.log(order.coupon_lines);

            const totalAmount = order.total;
            const restaurantId = 3;
            const tId = 'un-paid';
            const paidVia = 'un-paid';
            const orderId = order.id;

            const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
            const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurantId]);
            const timeZone = timeZoneResult[0].time_zone;
            const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

            const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, total_amount, restaurant_id, tid, paid_via, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const orderValues = [21, tableId, orderTime, totalAmount, restaurantId, 'un-paid', 'un-paid', totalAmount];
            const orderInsertResult = await poolConnection.query(orderInsertQuery, orderValues);
            const orderInsertID = orderInsertResult.insertId;

            const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Status, TStatus, PStatus, split_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, 'not-sent', 'not-sent', 'not-sent', ?)`;

            for (const item of order.line_items) {
                const getMenuItem = `SELECT * FROM menuitems WHERE Name = ? AND restaurant_id = ?`;
                const getMenuItemRes = await poolConnection.query(getMenuItem, [item.name, restaurantId]);
                const MenuItemID = getMenuItemRes[0].MenuItemID;
                const itemName = item.name;
                const price = item.subtotal;
                const quantity = item.quantity;
                let kitchenId = 1;

                const sku = item.sku;
                const trimmedSku = sku.substring(sku.indexOf('k') + 1);

                if (trimmedSku === '1') {
                    kitchenId = 10;
                }
                if (trimmedSku === '2') {
                    kitchenId = 9;
                }
                const categoryId = 1;

                const orderItemsValues = [orderInsertID, MenuItemID, itemName, price, quantity, kitchenId, categoryId, quantity];
                await poolConnection.query(orderItemsInsertQuery, orderItemsValues);

                const updateInventoryQuery = 'UPDATE inventory SET on_hand = GREATEST(on_hand - ?, 0) WHERE MenuItemID = ?';
                const updateInventoryValues = [quantity, MenuItemID];
                await poolConnection.query(updateInventoryQuery, updateInventoryValues);
            }

            const updateTableStatusQuery = 'UPDATE tables SET status = ?, pay_status = ? WHERE table_id = ?';
            const updateTableStatusValues = ['reserved', 'not-vacant', tableId];
            await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

            const updatedOrderStatus = 'completed';
            const updateOrderStatusUrl = `https://anunziointernational.com/tanah/wp-json/wc/v3/orders/${orderId}`;

            try {
                await axios.put(updateOrderStatusUrl, { status: updatedOrderStatus }, {
                    headers: {
                        Authorization: `Basic ${authString}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log(`Order ${orderId} status updated successfully!`);
            } catch (error) {
                console.error(`Error updating order ${orderId} status:`, error.message);
            }
        }

        await poolConnection.query('COMMIT');
        console.log('Data Inserted Woo! redirecting...');
        setTimeout(() => {
            res.redirect('https://www.google.com');
        }, 3000);
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error('Error fetching data:', error.message);
        res.status(500).json({ status: 500, message: 'Internal Server Error!' });
    }
}

module.exports = {
    getAllOrders
}