const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');

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
    // try {
    //     await poolConnection.query('START TRANSACTION');

    //     const { orderId, tid, paidVia, items } = req.body;
    //     const { restaurant_id } = req.params;

    //     const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
    //     const orderResult = await poolConnection.query(getOrderQuery, [orderId]);

    //     if (orderResult.length === 0) {
    //         throw new Error({ status: 404, message: 'Order not found!' });
    //     }

    //     const fetchedOrder = orderResult[0];

    //     if (fetchedOrder.order_status === 'paid') {
    //         throw new Error({ status: 401, message: 'Bill is already paid!' });
    //     }

    //     const getItemDetailsQuery = `SELECT * FROM order_items WHERE OrderID = ? AND split_status = 'unsplitted'`;
    //     const itemDetailsResult = await poolConnection.query(getItemDetailsQuery, [orderId]);

    //     const insertSplitItemQuery = 'INSERT INTO bill_split_item (OrderID, MenuItemID, ItemName, SplitAmount, tid, paid_via, SplitQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)';

    //     const updateOrderItemQuantityQuery = 'UPDATE order_items SET split_quantity = ? WHERE OrderID = ? AND OrderItemID = ?';

    //     const getMenuItemDetailsQuery = `SELECT * FROM menuitems WHERE MenuItemID = ? AND restaurant_id = ?`;

    //     const checkExtrasQuery = `SELECT * FROM order_extras WHERE OrderItemID = ? AND split_status = 'unsplitted'`;

    //     const updateExtrasStatusQuery = `UPDATE order_extras SET split_status = ? WHERE OrderExtrasID = ?`;

    //     const getExtrasDetailQuery = `SELECT * FROM menu_extras WHERE extras_id = ?`;

    //     const updateRemainingQuery = 'UPDATE orders SET remaining = ?, after_tax = after_tax + ? WHERE OrderID = ?';

    //     const checkSpecificSplitQuantityQuery = 'SELECT split_quantity FROM order_items WHERE OrderItemID = ? AND MenuItemID = ?';

    //     const markOrderItemSplittedQuery = 'UPDATE order_items SET split_status = "splitted" WHERE OrderID = ? AND OrderItemID = ?';

    //     const markMenuItemSplittedQuery = 'UPDATE order_items SET split_status = "splitted" WHERE OrderID = ? AND MenuItemID = ?';

    //     for (const item of items) {
    //         const itemDetails = itemDetailsResult.find(details => details.MenuItemID === item.menuitemID);

    //         if (itemDetails) {
    //             const getMenuItemDetailsResult = await poolConnection.query(getMenuItemDetailsQuery, [item.menuitemID, restaurant_id]);

    //             let itemPrice = getMenuItemDetailsResult[0].Price * item.quantity;

    //             console.log(`item Price: ${itemPrice}`);

    //             const checkExtrasResult = await poolConnection.query(checkExtrasQuery, [itemDetails.OrderItemID]);

    //             console.log(`extras: ${JSON.stringify(checkExtrasResult[0], null, 2)}`);

    //             if (checkExtrasResult.length > 0) {
    //                 for (const extra of checkExtrasResult) {
    //                     const getExtrasDetailResult = await poolConnection.query(getExtrasDetailQuery, [extra.extras_id]);

    //                     let extrasPrice = getExtrasDetailResult[0].extras_price;
    //                     itemPrice += extrasPrice;
    //                     console.log(`extras price: ${extrasPrice}, updated item price: ${itemPrice}`);
    //                 }
    //             }

    //             const getTaxQuery = `SELECT tax FROM restaurants WHERE restaurant_id = ?`;
    //             const getTaxResult = await poolConnection.query(getTaxQuery, [restaurant_id]);

    //             const taxPercent = getTaxResult[0].tax;

    //             const taxAmount = (taxPercent / 100) * itemPrice;

    //             const afterTax = itemPrice + taxAmount;

    //             const remainingAmount = fetchedOrder.remaining - itemPrice;

    //             console.log(`remainingAmount: ${remainingAmount}, taxPercent: ${taxPercent}, taxAmount: ${taxAmount}, afterTax: ${afterTax}`);

    //             const updatedQuantity = itemDetails.split_quantity - item.quantity;

    //             if (updatedQuantity >= 0) {
    //                 await poolConnection.query(updateOrderItemQuantityQuery, [updatedQuantity, orderId, itemDetails.OrderItemID]);
    //                 console.log('Quantity updated!');

    //                 await poolConnection.query(updateRemainingQuery, [remainingAmount, afterTax, orderId]);
    //                 console.log('Remaining Updated!');

    //                 await poolConnection.query(insertSplitItemQuery, [orderId, item.menuitemID, itemDetails.ItemName, afterTax, tid, paidVia, item.quantity]);
    //                 console.log('Data inserted in Split Bill!');
    //             } else {
    //                 console.error(`Not enough quantity to split for MenuItemID ${item.menuitemID}`);
    //             }

    //             if (checkExtrasResult.length > 0) {
    //                 // If extras are present, check split_quantity before marking the specific order item as "splitted"
    //                 const checkSplitQuantityResult = await poolConnection.query(checkSpecificSplitQuantityQuery, [itemDetails.OrderItemID, item.menuitemID]);
    //                 const itemsWithZeroSplit = checkSplitQuantityResult[0].split_quantity;

    //                 if (itemsWithZeroSplit === 0) {
    //                     await poolConnection.query(markOrderItemSplittedQuery, [orderId, itemDetails.OrderItemID]);
    //                     console.log('With extras item set splitted!');

    //                     for (const extrasStatus of checkExtrasResult) {
    //                         await poolConnection.query(updateExtrasStatusQuery, ['splitted', extrasStatus.OrderExtrasID])
    //                         console.log('Extras Status marked splitted!');
    //                     }
    //                 }
    //             } else {
    //                 // If no extras are present, check split_quantity before marking the menu item as "splitted"
    //                 const checkSplitQuantityResult = await poolConnection.query(checkSpecificSplitQuantityQuery, [itemDetails.OrderItemID, item.menuitemID]);
    //                 const itemsWithZeroSplit = checkSplitQuantityResult[0].split_quantity;

    //                 if (itemsWithZeroSplit === 0) {
    //                     await poolConnection.query(markMenuItemSplittedQuery, [orderId, item.menuitemID]);
    //                     console.log('Without extras item set splitted!');
    //                 }
    //             }
    //         }
    //     }

    //     const remainingItemsQuery = 'SELECT COUNT(*) AS remainingItems FROM order_items WHERE OrderID = ? AND split_status != "splitted"';
    //     const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);
    //     const remainingItemCount = remainingItemsResult[0].remainingItems;

    //     if (remainingItemCount === 0) {
    //         const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid", tid = "itsplit", paid_via = "itsplit" WHERE OrderID = ?';
    //         await poolConnection.query(updateOrderStatusQuery, [orderId]);
    //         console.log('Orders Marked Paid!');

    //         const updateTableStatusQuery = 'UPDATE tables SET status = ? WHERE table_id = ?';
    //         const updateTableStatusValues = ['available', fetchedOrder.table_id];
    //         await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);
    //         console.log('Table set available!');
    //     }

    //     await poolConnection.query('COMMIT');
    //     res.status(201).json({ status: 201, message: 'Bill split successfully!' });
    // } catch (error) {
    //     await poolConnection.query('ROLLBACK');
    //     console.error(`Error splitting bill! Error: ${error.message}`);
    //     res.status(500).json({ status: 500, message: `Error splitting bill! ${error.message}` });
    // }

    try {
        await poolConnection.query('START TRANSACTION');

        const { orderId, tid, paidVia, items } = req.body;
        const { restaurant_id } = req.params;

        const getOrderQuery = 'SELECT * FROM orders WHERE OrderID = ?';
        const orderResult = await poolConnection.query(getOrderQuery, [orderId]);

        if (orderResult.length === 0) {
            throw new Error({ status: 404, message: 'Order not found!' });
        }

        const fetchedOrder = orderResult[0];

        if (fetchedOrder.order_status === 'paid') {
            throw new Error({ status: 401, message: 'Bill is already paid!' });
        }

        for (const item of items) {

            const orderItemDetails = `SELECT * FROM order_items WHERE OrderItemID = ? AND OrderID = ?`;
            const orderItemDetailsResult = await poolConnection.query(orderItemDetails, [item.OrderItemID, orderId]);

            const orderItem = orderItemDetailsResult[0];

            const getOrderExtras = `SELECT * FROM order_extras WHERE OrderItemID = ?`;
            const getOrderExtrasResult = await poolConnection.query(getOrderExtras, [item.OrderItemID]);

            const itemDetails = `SELECT * FROM menuitems WHERE MenuItemID = ?`;
            const itemDetailsResult = await poolConnection.query(itemDetails, [orderItem.MenuItemID]);

            const menuItem = itemDetailsResult[0];

            let itemPrice = menuItem.Price;

            if (getOrderExtrasResult.length > 0) {
                for (const extra of getOrderExtrasResult) {
                    const getExtrasDetailQuery = `SELECT * FROM menu_extras WHERE extras_id = ?`;
                    const getExtrasDetailResult = await poolConnection.query(getExtrasDetailQuery, [extra.extras_id]);

                    let extrasPrice = getExtrasDetailResult[0].extras_price;
                    itemPrice += extrasPrice;
                    console.log(`extras price: ${extrasPrice}, updated item price: ${itemPrice}`);
                }
            }

            itemPrice * item.quantity;

            const getTaxQuery = `SELECT * FROM restaurants WHERE restaurant_id = ?`;
            const getTaxResult = await poolConnection.query(getTaxQuery, [restaurant_id]);

            const taxPercent = getTaxResult[0].tax;

            const taxAmount = (taxPercent / 100) * itemPrice;

            const afterTax = itemPrice + taxAmount;

            const remainingAmount = fetchedOrder.remaining - itemPrice;

            const updateOrderAfterTaxAndRemaining = `UPDATE orders SET remaining = ?, after_tax = after_tax + ? WHERE OrderID = ?`;
            await poolConnection.query(updateOrderAfterTaxAndRemaining, [remainingAmount, afterTax, orderId]);

            const splitQuantity = orderItem.split_quantity - item.quantity;

            if (splitQuantity >= 0) {
                const updateOrderItemQuantityQuery = 'UPDATE order_items SET split_quantity = ? WHERE OrderID = ? AND OrderItemID = ?';
                await poolConnection.query(updateOrderItemQuantityQuery, [splitQuantity, orderId, item.OrderItemID]);

                console.log('order split quantity updated!');

                const tidValue = tid.toUpperCase();
                const paidViaValue = paidVia.toUpperCase();

                const insertSplitItemQuery = 'INSERT INTO bill_split_item (OrderID, MenuItemID, ItemName, SplitAmount, tid, paid_via, SplitQuantity, before_tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                await poolConnection.query(insertSplitItemQuery, [orderId, menuItem.MenuItemID, menuItem.Name, afterTax, tidValue, paidViaValue, item.quantity, itemPrice]);

                console.log('inserted into bill split.');
            }

            const checkSpecificSplitQuantityQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND OrderItemID = ?';
            const checkSpecificSplitQuantity = await poolConnection.query(checkSpecificSplitQuantityQuery, [orderId, item.OrderItemID]);

            const checkQuantity = checkSpecificSplitQuantity[0].split_quantity;
            console.log(`CheckQunatity: ${checkQuantity}`);

            if (checkQuantity == 0) {
                const markOrderItemSplittedQuery = 'UPDATE order_items SET split_status = "splitted" WHERE OrderID = ? AND OrderItemID = ?';
                await poolConnection.query(markOrderItemSplittedQuery, [orderId, item.OrderItemID]);
                console.log(`CheckQunatity: ${checkQuantity}! Order updated to splitted!`);
            }

        }

        const remainingItemsQuery = 'SELECT COUNT(*) AS remainingItems FROM order_items WHERE OrderID = ? AND split_status != "splitted"';
        const remainingItemsResult = await poolConnection.query(remainingItemsQuery, [orderId]);
        const remainingItemCount = remainingItemsResult[0].remainingItems;

        console.log(`remainingQuantity: ${remainingItemCount}`);

        if (remainingItemCount == 0) {
            const updateOrderStatusQuery = 'UPDATE orders SET order_status = "paid", tid = "itsplit", paid_via = "itsplit" WHERE OrderID = ?';
            await poolConnection.query(updateOrderStatusQuery, [orderId]);
            console.log('Orders Marked Paid!');

            const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
            const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

            const timeZone = timeZoneResult[0].time_zone;
            const orderPayTime = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

            const updateTableStatusQuery = 'UPDATE tables SET status = ?, pay_time = ? WHERE table_id = ?';
            const updateTableStatusValues = ['available', orderPayTime, fetchedOrder.table_id];
            await poolConnection.query(updateTableStatusQuery, updateTableStatusValues);
            console.log('Table set available!');
        }

        await poolConnection.query('COMMIT');

        try {
            const getTheOrder = `SELECT * FROM bill_split_item WHERE OrderID = ? AND receipt = 'false'`;
            const getTheOrderRes = await poolConnection.query(getTheOrder, [orderId]);

            const orderDetails = getTheOrderRes;

            const getTheMainOrder = `SELECT * FROM orders WHERE OrderID = ?`;
            const getTheMainOrderRes = await poolConnection.query(getTheMainOrder, [orderId]);

            const mainOrderDetails = getTheMainOrderRes[0];

            const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
            const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

            const timeZone = timeZoneResult[0].time_zone;

            const formattedDate = moment.tz(timeZone).format('YYYY-MM-DD');
            const formattedTime = moment.tz(timeZone).format('HH:mm:ss');

            // const orderTotal = orderDetails.before_tax;
            // const afterTax = orderDetails.splitAmount;
            const paidVia = orderDetails.paid_via;
            const tid = orderDetails.tid;
            // const orderId = mainOrderDetails.OrderID;

            const waiter_id = mainOrderDetails.waiter_id;

            const table_id = mainOrderDetails.table_id;

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

            const itemsArray = [];

            let totalBeforeTax;
            let totalAfterTax;

            for (const item of orderDetails) {
                const itemPrice = item.before_tax;
                const itemName = item.ItemName;
                const quantity = item.quantity;
                totalBeforeTax += itemPrice;
                totalAfterTax += item.SplitAmount;

                itemsArray.push({ itemName, quantity, waiterName, tableName, restaurantName, itemPrice });

            }

            let messageMap = itemsArray.map(async (item) => {
                // const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
                //                     JOIN order_extras ON menu_extras.extras_id = order_extras.extras_id
                //                     WHERE order_extras.OrderItemID = ?`;
                // const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

                // const extrasList = extrasResult.length > 0
                //     ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
                //     : '';

                return `${item.quantity} ${item.itemName} ${currency} ${item.itemPrice}`;
            });

            messageMap = await Promise.all(messageMap);

            const resName = `${restaurantName}`.toUpperCase();
            const messageTop = `OrderID: ${orderId}\n${waiterName}\n${tableName}\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            const message = `${messageMap.join('\n')}`;

            const messageBottom = `Order Total: ${totalBeforeTax}\nTax: ${tax}%\nAfter Tax: ${totalAfterTax}\nPayment Mode: ${paidVia}\nT-ID: ${tid}`;

            const thank = `THNAK YOU`;

            try {
                // const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
                const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

                const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
                const paperWidth = 303;

                const pdf = new PDFDocument({
                    size: [paperWidth, 792],
                    margin: 15,
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
                pdf.fontSize(16);

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