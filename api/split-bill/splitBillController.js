const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const upload = require('../../dropUpload/upload');

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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const createItSplit = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { orderId, tid, paidVia, cash, cash_change, items } = req.body;
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

            const splitQuantity = orderItem.split_quantity + item.quantity;

            const checkSplit = orderItem.Quantity - splitQuantity;

            if (checkSplit != 0 || checkSplit == 0) {
                const updateOrderItemQuantityQuery = 'UPDATE order_items SET split_quantity = ? WHERE OrderID = ? AND OrderItemID = ?';
                await poolConnection.query(updateOrderItemQuantityQuery, [splitQuantity, orderId, item.OrderItemID]);

                console.log('order split quantity updated!');

                const tidValue = tid.toUpperCase();
                const paidViaValue = paidVia.toUpperCase();

                const insertSplitItemQuery = 'INSERT INTO bill_split_item (OrderID, MenuItemID, ItemName, SplitAmount, tid, paid_via, SplitQuantity, before_tax, cash, cash_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                await poolConnection.query(insertSplitItemQuery, [orderId, menuItem.MenuItemID, menuItem.Name, afterTax, tidValue, paidViaValue, item.quantity, itemPrice, cash, cash_change]);

                if (paidViaValue == 'CASH') {
                    const updateBalance = `UPDATE payment_methods SET closing_balance = closing_balance + ? WHERE p_name = ? AND restaurant_id = ?`;
                    await poolConnection.query(updateBalance, [afterTax, paidViaValue, restaurant_id]);
                    console.log(`Cash added! ${afterTax}`);
                }

                console.log('inserted into bill split.');
            }


            const checkSpecificSplitQuantityQuery = 'SELECT * FROM order_items WHERE OrderID = ? AND OrderItemID = ?';
            const checkSpecificSplitQuantity = await poolConnection.query(checkSpecificSplitQuantityQuery, [orderId, item.OrderItemID]);

            const checkQuantity = checkSpecificSplitQuantity[0].Quantity;
            const checkSplitQuantity = checkSpecificSplitQuantity[0].split_quantity;

            const checkSplitAgain = checkQuantity - checkSplitQuantity;
            console.log(`CheckQunatity: ${checkSplitAgain}`);

            if (checkSplitAgain == 0) {
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
            const paidVia = orderDetails[0].paid_via;
            const tid = orderDetails[0].tid;
            const cash = orderDetails[0].cash;
            const cashChange = orderDetails[0].cash_change;
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
            const contact = restaurantResult[0].contact;
            const site = restaurantResult[0].site;

            const itemsArray = [];

            let totalBeforeTax = 0;
            let totalAfterTax = 0;

            for (const item of orderDetails) {
                const itemPrice = item.before_tax;
                const itemName = item.ItemName;
                const quantity = item.SplitQuantity;
                totalBeforeTax += item.before_tax;
                totalAfterTax += item.SplitAmount;

                itemsArray.push({ itemName, quantity, waiterName, tableName, restaurantName, itemPrice });
            }

            // let messageMap = itemsArray.map(async (item) => {
            //     // const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
            //     //                     JOIN order_extras ON menu_extras.extras_id = order_extras.extras_id
            //     //                     WHERE order_extras.OrderItemID = ?`;
            //     // const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

            //     // const extrasList = extrasResult.length > 0
            //     //     ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
            //     //     : '';

            //     return `${item.quantity} ${item.itemName} ${currency} ${item.itemPrice}`;
            // });

            // messageMap = await Promise.all(messageMap);

            const resName = `${restaurantName}`.toUpperCase();
            const messageTop = `OrderID: ${orderId}\n${waiterName}\n${tableName}\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            // const message = `${messageMap.join('\n')}`;

            // const messageBottom = `Order Total: ${totalBeforeTax}\nTax: ${tax}%\nAfter Tax: ${totalAfterTax}\nPayment Mode: ${paidVia}\nT-ID: ${tid}`;

            const cashInfo = paidVia === 'CASH' ? `Cash Received: ${cash}\nChange: ${cashChange}` : '';

            const mb1 = `Order Total`;
            const mb1Val = totalBeforeTax.toFixed(2);
            const mb2 = `Tax`;
            const mb2Val = `${tax}%`
            const mb3 = `After Tax`;
            const mb3Val = totalAfterTax.toFixed(2);
            const mb4 = `Payment Mode`;
            const mb4Val = paidVia;
            const mb5 = `T-ID`;
            const mb5Val = tid;
            const mb6 = `Cash Received`;
            const mb6Val = cash;
            const mb7 = `Change`;
            const mb7Val = cashChange;

            const messageBottom = `Order Total: ${totalBeforeTax}\nTax: ${tax}%\nAfter Tax: ${totalAfterTax}\nPayment Mode: ${paidVia}\nT-ID: ${tid}` + (cashInfo ? `\n${cashInfo}` : '');

            const thank = `THANK YOU`;
            const softwareBy = `software by`;
            const anunzio = `Anunzio International FZC`;
            const website = `www.anunziointernational.com`;
            const number = `+971-58-551-5742`;
            const email = `info@anunziointernational.com`;

            // const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
            // const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

            const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
            const paperWidth = 302;

            const pdf = new PDFDocument({
                size: [paperWidth, 1200],
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
            pdf.fontSize(14);

            // pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);
            pdf.moveDown();
            centerText(resName, 16);
            // pdf.moveDown();
            centerText(contact, 16);
            // pdf.moveDown();
            centerText(site, 16);
            // pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);

            pdf.moveDown();
            pdf.text(messageTop);
            pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);

            // pdf.moveDown();
            // pdf.text(message);
            pdf.moveDown();
            // drawDottedLine(pdf.y, paperWidth);

            for (const item of itemsArray) {
                const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
                                    JOIN order_extras ON menu_extras.extras_id = order_extras.extras_id
                                    WHERE order_extras.OrderItemID = ?`;
                const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

                const extrasList = extrasResult.length > 0
                    ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
                    : '';
                const itemName = `${item.quantity} ${item.itemName} ${extrasList}`;
                const price = `${currency} ${item.itemPrice.toFixed(2)}`;

                // pdf.moveDown();
                // Position item name on the left
                // Position item name and price on the left
                const priceY = pdf.y - 1;
                pdf.text(itemName, 10, pdf.y, { align: 'left' });
                pdf.text(price, 10, priceY, { align: 'right' });
                // pdf.moveTo(10, pdf.y).lineTo(paperWidth - 10, pdf.y).stroke();
            }
            pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);
            pdf.moveDown();
            pdf.text(mb1, 10, pdf.y, { align: 'left' });
            pdf.text(mb1Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb2, 10, pdf.y, { align: 'left' });
            pdf.text(mb2Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb3, 10, pdf.y, { align: 'left' });
            pdf.text(mb3Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb4, 10, pdf.y, { align: 'left' });
            pdf.text(mb4Va, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb5, 10, pdf.y, { align: 'left' });
            pdf.text(mb5Val, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb6, 10, pdf.y, { align: 'left' });
            pdf.text(mb6Val, 10, pdf.y - 15, { align: 'right' });
            pdf.text(mb7, 10, pdf.y, { align: 'left' });
            pdf.text(mb7Val, 10, pdf.y - 15, { align: 'right' });
            pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);

            pdf.moveDown();
            centerText(thank, 16);
            // pdf.moveDown();
            centerText(softwareBy, 16);
            centerText(anunzio, 16);
            centerText(website, 16);
            centerText(number, 16);
            centerText(email, 16);
            drawDottedLine(pdf.y, paperWidth);

            pdf.end();

            const fileContent = fs.createReadStream(pdfPath);
            await upload.uploadFile(pdfPath, fileContent);

            // const transporter = nodemailer.createTransport({
            //     service: 'gmail',
            //     auth: {
            //         user: 'siddiquiboy360@gmail.com',
            //         pass: 'gkop jksn urdi dgvv'
            //     }
            // });

            // const mailOptions = {
            //     from: 'siddiquiboy360@gmail.com',
            //     to,
            //     attachments: [
            //         {
            //             filename: `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`,
            //             path: pdfPath,
            //             encoding: 'base64'
            //         }
            //     ]
            // };

            // const info = await transporter.sendMail(mailOptions);

            // for (const split of orderDetails) {
            //     const updateReciptStatus = `UPDATE bill_split_item SET receipt = 'true' WHERE SplitItemID = ?`;
            //     await poolConnection.query(updateReciptStatus, [split.SplitItemID]);
            // }

            console.log('File Sent! and Status updated!');

            fs.unlinkSync(pdfPath);
        } catch (error) {
            console.log(error);
            return;
        }
        await poolConnection.query('COMMIT');
        res.status(201).json({ status: 201, message: 'Bill split successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    createEqSplit,
    createItSplit
}