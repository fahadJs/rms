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

                const orderId = order.id;

                    const updatedOrderStatus = 'pending';
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

                const nonCompletedOrders = order.filter(order => order.status !== 'completed');

                nonCompletedOrders.forEach(order => {
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
                        category: ${categoryId}
                    `);
                    });
                });
                res.json('done!');
            })
            .catch(error => {
                console.error('Error fetching data:', error.message);
            });
    } catch (error) {
        console.log(`Error! Fetching Orders! ${error}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error!' });
    }
}

module.exports = {
    getAllOrders
}