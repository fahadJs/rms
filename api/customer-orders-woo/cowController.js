const poolConnection = require('../../config/database');
const axios = require('axios');

const getAllOrders = async (req, res) => {
    try {
        const apiUrl = 'https://anunziointernational.com/tanah/wp-json/wc/v3/orders';
        const consumerKey = 'ck_d02faf8414ff73ce9be2c97df738aa4419d65266';
        const consumerSecret = 'cs_b335e4e1ea326c697cee0079271870d197477b4d';

        const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        axios.get(apiUrl, {
            headers: {
                Authorization: `Basic ${authString}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                const order = response.data;

                const nonCompletedOrders = order.filter(order => order.status !== 'completed');

                nonCompletedOrders.forEach(order => {
                    // For Order
                    if (order.coupon_lines.length > 0) {
                        const coupon = order.coupon_lines[0];
                        console.log(coupon);
                        tableId = coupon.code;
                    }
                    let tableId = 0
                    const totalAmount = order.total;
                    const restaurantId = 3;
                    const tId = 'un-paid';
                    const paidVia = 'un-paid';            
                    const orderId = order.id;

                    const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
                    const timeZoneResult = poolConnection.query(timeZoneQuery, [restaurantId]);

                    const timeZone = timeZoneResult[0].time_zone;
                    const orderTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

                    const orderInsertQuery = 'INSERT INTO orders (waiter_id, table_id, time, total_amount, restaurant_id, tid, paid_via, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    const orderValues = [1, tableId, orderTime, totalAmount, restaurantId, 'un-paid', 'un-paid', totalAmount];
                    const orderResult = poolConnection.query(orderInsertQuery, orderValues);

                    const orderInsertID = orderResult.insertId;

                    const orderItemsInsertQuery = `INSERT INTO order_items (OrderID, MenuItemID, ItemName, Price, Quantity, KitchenID, CategoryID, Note, Status, TStatus, PStatus, split_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not-sent', 'not-sent', 'not-sent', ?)`;

                    order.line_items.forEach(item => {
                        // For OrderItems
                        const MenuItemID = 34;
                        const itemName = item.name;
                        const price = item.subtotal;
                        const quantity = item.quantity;
                        let kitchenId = 1

                        const sku = item.sku;
                        const trimmedSku = sku.substring(sku.indexOf('k') + 1);
                        console.log('Trimmed SKU:', trimmedSku);

                        if (trimmedSku == '1') {
                            kitchenId = 10;
                        }
                        if (trimmedSku == '2') {
                            kitchenId = 9;
                        }
                        const categoryId = 1;

                        console.log(`
                        table: ${tableId}
                        total: ${totalAmount}
                        restaurant: ${restaurantId}
                        tid: ${tId}
                        paidVia: ${paidVia}

                        menuitem: ${MenuItemID}
                        item: ${itemName}
                        price: ${price}
                        quantity: ${quantity}
                        kitchen: ${kitchenId}
                        category: ${categoryId}`);

                        const orderItemsValues = [orderInsertID, MenuItemID, itemName, price, quantity, kitchenId, categoryId, quantity];
                        const orderItemsResult = poolConnection.query(orderItemsInsertQuery, orderItemsValues);
                    });

                    const updateTableStatusQuery = 'UPDATE tables SET status = ?, pay_status = ? WHERE table_id = ?';
                    const updateTableStatusValues = ['reserved', 'not-vacant', tableId];
                    poolConnection.query(updateTableStatusQuery, updateTableStatusValues);

                    const updatedOrderStatus = 'completed';
                    const updateOrderStatusUrl = `https://anunziointernational.com/tanah/wp-json/wc/v3/orders/${orderId}`;

                    axios.put(updateOrderStatusUrl, {
                        status: updatedOrderStatus,
                    }, {
                        headers: {
                            Authorization: `Basic ${authString}`,
                            'Content-Type': 'application/json',
                        },
                    })
                        .then(response => {
                            console.log(`Order ${orderId} status updated successfully!`);
                        })
                        .catch(error => {
                            console.error(`Error updating order ${orderId} status:`, error.message);
                        });
                });

                poolConnection.query('COMMIT');
                res.json({ status: 200, message: 'done!' });
            })
            .catch(error => {
                console.error('Error fetching data:', error.message);
            });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! Fetching Orders! ${error}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error!' });
    }
}

module.exports = {
    getAllOrders
}