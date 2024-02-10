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

            // Dummy Coupon Example.
            // {
            //     "customer_id": 1,
            //     "billing": {
            //       "first_name": "John",
            //       "last_name": "Doe",
            //       "address_1": "123 Main St",
            //       "city": "Cityville",
            //       "postcode": "12345",
            //       "country": "US",
            //       "email": "john.doe@example.com",
            //       "phone": "555-555-5555"
            //     },
            //     "shipping": {
            //       "first_name": "John",
            //       "last_name": "Doe",
            //       "address_1": "123 Shipping St",
            //       "city": "Shipping City",
            //       "postcode": "54321",
            //       "country": "US"
            //     },
            //     "line_items": [
            //       {
            //         "product_id": 1,
            //         "quantity": 2
            //       },
            //       {
            //         "product_id": 2,
            //         "variation_id": 3,
            //         "quantity": 1
            //       }
            //     ],
            //     "coupon_lines": [
            //       {
            //         "code": "SUMMER2024",
            //         "discount": "10.00",
            //         "discount_tax": "1.80",
            //         "meta_data": [
            //           {
            //             "key": "coupon_data",
            //             "value": {
            //               "coupon_type": "percentage",
            //               "description": "Summer Discount"
            //             }
            //           }
            //         ]
            //       }
            //     ],
            //     "shipping_lines": [
            //       {
            //         "method_id": "flat_rate",
            //         "method_title": "Flat Rate",
            //         "total": "5.00"
            //       }
            //     ],
            //     "fee_lines": [
            //       {
            //         "name": "Handling Fee",
            //         "tax_class": "",
            //         "tax_status": "none",
            //         "total": "5.00"
            //       }
            //     ],
            //     "shipping_tax_total": "2.50",
            //     "tax_lines": [
            //       {
            //         "name": "Sales Tax",
            //         "rate_code": "US_CA_SALES_TAX",
            //         "rate_id": "tax_1",
            //         "compound": false,
            //         "tax_total": "3.60",
            //         "shipping_tax_total": "0.90",
            //         "meta_data": [
            //           {
            //             "key": "tax_rate_name",
            //             "value": "CA Sales Tax"
            //           }
            //         ]
            //       }
            //     ],
            //     "total": "71.90",
            //     "subtotal": "60.00",
            //     "total_tax": "7.50"
            //   }

            let tableId;
            if (order.coupon_lines.length > 0) {
                const coupon = order.coupon_lines[0];
                tableId = coupon.code;
            } else {
                console.log('No Coupon! So No Table!...');
                throw new Error('No Table...!');
            }

            console.log(`Table: ${tableId}`);
            // console.log(`Coupon Array! ${JSON.stringify(order.coupon_lines)}`);

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

                let MenuItemID;
                if (getMenuItemRes.length > 0) {
                    const menuItem = getMenuItemRes[0];
                    if (menuItem.MenuItemID) {
                        MenuItemID = menuItem.MenuItemID;
                    } else {
                        throw new Error('Invalid menu item data: Item ID not found!');
                    }
                } else {
                    throw new Error('Menu item not found!');
                }
                const itemName = item.name;
                const price = item.subtotal;
                const quantity = item.quantity;

                let kitchenId;
                const sku = item.sku;
                const trimmedSku = sku.substring(sku.indexOf('k') + 1);

                if (trimmedSku === '1') {
                    kitchenId = 10;
                } else if (trimmedSku === '2') {
                    kitchenId = 9;
                } else {
                    console.log('No Kitchen Fetched...! No SKU DATA FOUND!');
                    throw new Error('No Kitchen Fetched...!');
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
        res.redirect('https://anunziointernational.com/tanah/home/');
        // res.json(orders);
        // res.redirect('https://www.google.com');
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getAllOrders
}