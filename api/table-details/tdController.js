const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const getAll = async (req, res) => {
    try {
        const { table_id, restaurant_id } = req.params;

        const ordersQuery = `
            SELECT
                OrderID,
                waiter_id,
                table_id,
                time,
                order_status,
                bill_status,
                total_amount
            FROM
                orders
            WHERE
                table_id = ? AND order_status != 'paid' AND restaurant_id = ?;`;

        const ordersResult = await poolConnection.query(ordersQuery, [table_id, restaurant_id]);

        if (ordersResult.length === 0) {
            res.status(200).json({ status: 200, message: "Table is already PAID and AVAILABLE!" });
            return;
        }

        const orderItemsQuery = `
            SELECT
                oi.OrderID,
                oi.OrderItemID,
                oi.MenuItemID,
                oi.ItemName,
                oi.Price,
                oi.Quantity,
                oi.split_quantity,
                oi.KitchenID,
                oi.CategoryID,
                oi.Note,
                oe.extras_id,
                me.extras_name,
                me.extras_price
            FROM
                order_items oi
            LEFT JOIN
                order_extras oe ON oi.OrderItemID = oe.OrderItemID
            LEFT JOIN
                menu_extras me ON oe.extras_id = me.extras_id
            WHERE
                oi.OrderID IN (?)
        `;

        const orderIDs = ordersResult.map(order => order.OrderID);
        const orderItemsResult = await poolConnection.query(orderItemsQuery, [orderIDs]);

        const orderItemsMap = new Map();

        orderItemsResult.forEach(orderItem => {
            const orderID = orderItem.OrderID;
            const orderItemID = orderItem.OrderItemID;

            if (!orderItemsMap.has(orderID)) {
                orderItemsMap.set(orderID, []);
            }

            const itemWithExtras = orderItemsMap.get(orderID).find(item => item.OrderItemID === orderItemID);

            let quantity = orderItem.Quantity - orderItem.split_quantity;

            if (!itemWithExtras) {
                orderItemsMap.get(orderID).push({
                    OrderItemID: orderItemID,
                    MenuItemID: orderItem.MenuItemID,
                    ItemName: orderItem.ItemName,
                    Price: orderItem.Price,
                    Quantity: quantity,
                    KitchenID: orderItem.KitchenID,
                    CategoryID: orderItem.CategoryID,
                    Note: orderItem.Note,
                    extras: orderItem.extras_id ? [{
                        extras_name: orderItem.extras_name,
                        extras_id: orderItem.extras_id,
                        extras_price: orderItem.extras_price
                    }] : []
                });
            } else {
                itemWithExtras.extras.push({
                    extras_name: orderItem.extras_name,
                    extras_id: orderItem.extras_id,
                    extras_price: orderItem.extras_price
                });
            }
        });

        const formattedResult = ordersResult.map(order => ({
            OrderID: order.OrderID,
            waiter_id: order.waiter_id,
            table_id: order.table_id,
            time: order.time,
            order_status: order.order_status,
            bill_status: order.bill_status,
            total_amount: order.total_amount,
            items: orderItemsMap.get(order.OrderID) || []
        }));

        res.status(200).json(formattedResult);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error while fetching order details!' });
    }
};

const removeItem = async (req, res) => {
    try {
        const { orderId, menuItemId } = req.params;

        await poolConnection.query('START TRANSACTION');

        const checkOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const checkOrderResult = await poolConnection.query(checkOrderQuery, [orderId]);

        if (checkOrderResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({ status: 404, message: 'Order not found!' });
        }

        const checkItemQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        const checkItemResult = await poolConnection.query(checkItemQuery, [orderId, menuItemId]);

        if (checkItemResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({ status: 404, message: 'Item not found in the order!' });
        }

        const removedItemQuantity = checkItemResult[0].Quantity;

        const removeItemQuery = 'DELETE FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        await poolConnection.query(removeItemQuery, [orderId, menuItemId]);

        const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
        await poolConnection.query(updateInventoryQuery, [removedItemQuantity, menuItemId]);

        const remainingItemsQuery = 'SELECT * FROM order_items WHERE OrderID = ?';
        const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);

        if (remainingItemsResult.length === 0) {
            const deleteOrderQuery = 'DELETE FROM orders WHERE OrderID = ?';
            await poolConnection.query(deleteOrderQuery, [orderId]);

            const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = ?';
            await poolConnection.query(updateTableQuery, [checkOrderResult[0].table_id]);
        }

        await poolConnection.query('COMMIT');

        res.status(200).json({ status: 200, message: 'Item removed from the order successfully!' });

    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error removing item from the order!' });
    }
}

const updateItemQuantity = async (req, res) => {
    try {
        const { orderId, menuItemId, receivedQuantity, receivedPrice } = req.params;

        await poolConnection.query('START TRANSACTION');

        const checkOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const checkOrderResult = await poolConnection.query(checkOrderQuery, [orderId]);

        if (checkOrderResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({ status: 404, message: 'Order not found!' });
        }

        const checkItemQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND MenuItemID = ?';
        const checkItemResult = await poolConnection.query(checkItemQuery, [orderId, menuItemId]);

        if (checkItemResult.length === 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(404).json({ status: 404, message: 'Item not found in the order!' });
        }

        const existingQuantity = checkItemResult[0].Quantity;

        const updateQuantityQuery = 'UPDATE order_items SET Quantity = ?, Price = ? WHERE OrderID = ? AND MenuItemID = ?';
        await poolConnection.query(updateQuantityQuery, [receivedQuantity, receivedPrice, orderId, menuItemId]);

        const quantityDifference = receivedQuantity - existingQuantity;

        if (quantityDifference > 0) {
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand - ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [quantityDifference, menuItemId]);
        } else if (quantityDifference < 0) {
            const remainingQuantity = Math.abs(quantityDifference);
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [remainingQuantity, menuItemId]);
        }

        await poolConnection.query('COMMIT');

        res.status(200).json({ status: 200, message: 'Item quantity updated successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error updating item quantity in the order!' });
    }
};

const mrkPaid = async (req, res) => {
    try {
        const { orderId, tid, paidVia, restaurant_id, cash, cash_change } = req.params;

        const startTransactionQuery = 'START TRANSACTION';
        await poolConnection.query(startTransactionQuery);

        const getTaxQuery = `SELECT tax FROM restaurants WHERE restaurant_id = ?`;
        const getTaxResult = await poolConnection.query(getTaxQuery, [restaurant_id]);

        const getTotalQuery = `SELECT total_amount FROM orders WHERE OrderID = ? AND restaurant_id = ?`;
        const getTotalResult = await poolConnection.query(getTotalQuery, [orderId, restaurant_id]);

        const taxPercent = getTaxResult[0].tax;
        const orderTotal = getTotalResult[0].total_amount;

        const taxAmount = (taxPercent / 100) * orderTotal;

        const afterTax = orderTotal + taxAmount;

        const tidValue = tid.toUpperCase();
        const paidViaValue = paidVia.toUpperCase();

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const orderPayTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const updateOrderQuery = 'UPDATE orders SET order_status = "paid", tid = ?, paid_via = ?, after_tax = ?, cash = ?, cash_change = ? WHERE OrderID = ?';
        await poolConnection.query(updateOrderQuery, [tidValue, paidViaValue, afterTax, cash, cash_change, orderId]);

        const updateTableQuery = 'UPDATE tables SET status = "available", pay_time = ? WHERE table_id = (SELECT table_id FROM orders WHERE OrderID = ?)';
        await poolConnection.query(updateTableQuery, [orderPayTime, orderId]);

        try {
            const getTheOrder = `SELECT * FROM orders WHERE OrderID = ?`;
            const getTheOrderRes = await poolConnection.query(getTheOrder, [orderId]);

            const orderDetails = getTheOrderRes[0];

            const getTheOrderItems = `SELECT * FROM order_items WHERE OrderID = ?`;
            const getTheOrderItemsRes = await poolConnection.query(getTheOrderItems, [orderId]);

            const orderItems = getTheOrderItemsRes;

            // const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
            // const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

            // const timeZone = timeZoneResult[0].time_zone;

            const formattedDate = moment.tz(timeZone).format('YYYY-MM-DD');
            const formattedTime = moment.tz(timeZone).format('HH:mm:ss');

            const orderTotal = orderDetails.total_amount;
            const afterTax = orderDetails.after_tax;
            const paidVia = orderDetails.paid_via;
            const tid = orderDetails.tid;
            const cash = orderDetails.cash;
            const cashChange = orderDetails.cash_change;
            // const orderId = orderDetails.OrderID;

            const waiter_id = orderDetails.waiter_id;

            const table_id = orderDetails.table_id;

            const waiterQuery = `SELECT * FROM waiters WHERE waiter_id = ?`;
            const waiterRes = await poolConnection.query(waiterQuery, [waiter_id]);

            const waiterName = waiterRes[0].waiter_name;

            const tableQuery = `SELECT table_name FROM tables WHERE table_id = ?`;
            const tableRes = await poolConnection.query(tableQuery, [table_id]);

            const tableName = `Table: ${tableRes[0].table_name}`

            const restaurantQuery = `SELECT * FROM restaurants WHERE restaurant_id = ?`;
            const restaurantResult = await poolConnection.query(restaurantQuery, [restaurant_id]);

            const restaurantName = restaurantResult[0].name;
            const tax = restaurantResult[0].tax;
            const currency = restaurantResult[0].default_currency;
            const contact = restaurantResult[0].contact;
            const site = restaurantResult[0].site;

            const itemsArray = [];

            for (const item of orderItems) {
                const itemPrice = item.Price;

                const itemId = item.OrderItemID;
                const itemName = item.ItemName;
                const quantity = item.Quantity;

                itemsArray.push({ itemId, itemName, quantity, waiterName, tableName, restaurantName, itemPrice });
            }

            let messageMap = itemsArray.map(async (item) => {
                const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
                                    JOIN order_extras ON menu_extras.extras_id = order_extras.extras_id
                                    WHERE order_extras.OrderItemID = ?`;
                const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

                const extrasList = extrasResult.length > 0
                    ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
                    : '';

                return `${item.quantity} ${item.itemName} ${currency} ${item.itemPrice}\n${extrasList}`;
            });

            messageMap = await Promise.all(messageMap);

            const resName = `${restaurantName}\n${contact}\n${site}`.toUpperCase();
            const messageTop = `OrderID: ${orderId}\n${waiterName}\n${tableName}\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            const message = `${messageMap.join('\n')}`;

            const cashInfo = paidVia === 'CASH' ? `Cash Received: ${cash}\nChange: ${cashChange}` : '';

            const messageBottom = `Order Total: ${orderTotal}\nTax: ${tax}%\nAfter Tax: ${afterTax}\nPayment Mode: ${paidVia}\nT-ID: ${tid}` + (cashInfo ? `\n${cashInfo}` : '');

            const thank = `THNAK YOU\nsoftware by\nAnunzio International FZC\nwww.anunziointernational.com\n+971-58-551-5742\ninfo@anunziointernational.com`;

            try {
                const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
                // const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

                const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
                const paperWidth = 288;

                const pdf = new PDFDocument({
                    size: [paperWidth, 600],
                    margin: 10,
                });

                function drawDottedLine(yPosition, length) {
                    const startX = pdf.x;
                    const endX = pdf.x + length;
                    const y = yPosition;

                    for (let i = startX; i <= endX; i += 5) {
                        pdf.moveTo(i, y).lineTo(i + 2, y).stroke();
                    }
                }

                function centerText(text, fontSize) {
                    const textWidth = pdf.widthOfString(text, { fontSize });
                    const xPosition = (paperWidth - textWidth) / 2;
                    const currentX = pdf.x;
                    pdf.text(text, xPosition, pdf.y);
                    pdf.x = currentX;
                }

                pdf.pipe(fs.createWriteStream(pdfPath));
                pdf.fontSize(9);

                // pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);
                pdf.moveDown();
                centerText(resName, 16);
                // pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);

                pdf.moveDown();
                pdf.text(messageTop);
                pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);

                pdf.moveDown();
                pdf.text(message);
                pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);

                pdf.moveDown();
                pdf.text(messageBottom);
                pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);

                pdf.moveDown();
                centerText(thank, 16);
                // pdf.moveDown();
                drawDottedLine(pdf.y, paperWidth);

                pdf.end();

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'siddiquiboy360@gmail.com',
                        pass: 'gkop jksn urdi dgvv'
                    }
                });

                const mailOptions = {
                    from: 'siddiquiboy360@gmail.com',
                    to,
                    attachments: [
                        {
                            filename: `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`,
                            path: pdfPath,
                            encoding: 'base64'
                        }
                    ]
                };

                const info = await transporter.sendMail(mailOptions);

                console.log('Email Sent! and Status updated!: ', info);

                fs.unlinkSync(pdfPath);
            } catch (error) {
                console.log(error);
                return;
            }
        } catch (error) {
            console.log(error);
            return;
        }

        const commitTransactionQuery = 'COMMIT';
        await poolConnection.query(commitTransactionQuery);

        res.status(200).json({ status: 200, message: 'Order status updated to "paid" and table status set to "available" successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);

        const rollbackTransactionQuery = 'ROLLBACK';
        await poolConnection.query(rollbackTransactionQuery);

        res.status(500).json({ status: 500, message: error.message });
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
            return res.status(404).json({ status: 404, message: 'Order not found!' });
        }

        const tableId = tableIdResult[0].table_id;

        const getOrderItemsQuery = 'SELECT MenuItemID, Quantity FROM order_items WHERE OrderID = ?';
        const orderItemsResult = await poolConnection.query(getOrderItemsQuery, [orderId]);

        const deleteSplitOrderItemsQuery = 'DELETE FROM bill_split_item WHERE OrderID = ?';
        await poolConnection.query(deleteSplitOrderItemsQuery, [orderId]);

        const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE OrderID = ?';
        await poolConnection.query(deleteOrderItemsQuery, [orderId]);

        const deleteOrderQuery = 'DELETE FROM orders WHERE OrderID = ?';
        await poolConnection.query(deleteOrderQuery, [orderId]);

        const updateTableQuery = 'UPDATE tables SET status = "available" WHERE table_id = ?';
        await poolConnection.query(updateTableQuery, [tableId]);

        for (const item of orderItemsResult) {
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = on_hand + ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [item.Quantity, item.MenuItemID]);
        }

        await poolConnection.query('COMMIT');

        res.status(200).json({ status: 200, message: 'Order deleted successfully and table status set to "available"!' });

    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error deleting order and updating table status!' });
    }
}

const markAvailable = async (req, res) => {
    try {
        const { table_id } = req.params;

        const updateTableQuery = 'UPDATE tables SET status = "available", pay_status = "vacant" WHERE table_id = ?';
        await poolConnection.query(updateTableQuery, [table_id]);

        res.status(200).json({ status: 200, message: 'Table status set to "available"!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error updating table status!' });
    }
}

module.exports = {
    getAll,
    mrkPaid,
    cancel,
    removeItem,
    updateItemQuantity,
    markAvailable
}