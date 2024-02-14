const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const mrkPaid = async (req, res) => {
    try {
        const { orderId, tid, paidVia, restaurant_id } = req.params;

        const startTransactionQuery = 'START TRANSACTION';
        await poolConnection.query(startTransactionQuery);

        const tidValue = tid.toUpperCase();
        const paidViaValue = paidVia.toUpperCase();

        const updateOrderQuery = 'UPDATE pos_orders SET order_status = "paid", tid = ?, paid_via = ? WHERE PosOrderID = ? AND restaurant_id = ?';
        await poolConnection.query(updateOrderQuery, [tidValue, paidViaValue, orderId, restaurant_id]);

        try {
            const getTheOrder = `SELECT * FROM pos_orders WHERE PosOrderID = ?`;
            const getTheOrderRes = await poolConnection.query(getTheOrder, [orderId]);

            const orderDetails = getTheOrderRes[0];

            const getTheOrderItems = `SELECT * FROM pos_order_items WHERE PosOrderID = ?`;
            const getTheOrderItemsRes = await poolConnection.query(getTheOrderItems, [orderId]);

            const orderItems = getTheOrderItemsRes;

            const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
            const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

            const timeZone = timeZoneResult[0].time_zone;

            const formattedDate = moment.tz(timeZone).format('YYYY-MM-DD');
            const formattedTime = moment.tz(timeZone).format('HH:mm:ss');

            const orderTotal = orderDetails.total_amount;
            // const afterTax = orderDetails.after_tax;
            const paidVia = orderDetails.paid_via;
            const tid = orderDetails.tid;
            // const cash = orderDetails.cash;
            // const cashChange = orderDetails.cash_change;
            // const orderId = orderDetails.OrderID;

            // const waiter_id = orderDetails.waiter_id;

            // const table_id = orderDetails.table_id;

            // const waiterQuery = `SELECT * FROM waiters WHERE waiter_id = ?`;
            // const waiterRes = await poolConnection.query(waiterQuery, [waiter_id]);

            // const waiterName = waiterRes[0].waiter_name;

            // const tableQuery = `SELECT table_name FROM tables WHERE table_id = ?`;
            // const tableRes = await poolConnection.query(tableQuery, [table_id]);

            // const tableName = `Table: ${tableRes[0].table_name}`

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

                const itemId = item.PosOrderItemID;
                const itemName = item.ItemName;
                const quantity = item.Quantity;

                itemsArray.push({ itemId, itemName, quantity, restaurantName, itemPrice });
            }
            // const priceColumnWidth = 0;
            // let messageMap = itemsArray.map(async (item) => {
            //     const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
            //                         JOIN order_extras ON menu_extras.extras_id = order_extras.extras_id
            //                         WHERE order_extras.OrderItemID = ?`;
            //     const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

            //     const extrasList = extrasResult.length > 0
            //         ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
            //         : '';

            //     // return `${item.quantity} ${item.itemName} ${currency} ${item.itemPrice}\n${extrasList}`;

            //     // const formattedItem = `${item.quantity} ${item.itemName} ${extrasList}`;
            //     // const priceAlignment = ' '.repeat(50 - formattedItem.length - item.itemPrice.toString().length);
            //     // const formattedPrice = `${priceAlignment} ${currency} ${item.itemPrice.toFixed(2)}`;

            //     // return `${formattedItem}${formattedPrice}`;

            //     // Format the item details with fixed-width columns for item name and price
            //     // const formattedItem = `${item.quantity} ${item.itemName} ${extrasList}`;
            //     // const formattedPrice = `${currency} ${item.itemPrice.toFixed(2)}`;

            //     // // Ensure the item name column has a fixed width
            //     // const truncatedItem = formattedItem.slice(0, itemNameColumnWidth);
            //     // const itemAlignment = ' '.repeat(itemNameColumnWidth - truncatedItem.length);

            //     // return `${truncatedItem}${itemAlignment}${formattedPrice}`;

            //     // Format the item details with fixed-width columns for item name and price
            //     // const formattedItem = `${item.quantity} ${item.itemName} ${extrasList}`;
            //     // const formattedPrice = `${currency} ${item.itemPrice.toFixed(2)}`;

            //     // return `${formattedItem}${repeat(100 - formattedItem.length - formattedPrice.length)}${formattedPrice}`;
            // });

            // messageMap = await Promise.all(messageMap);

            const resName = `${restaurantName}`.toUpperCase();
            // const messageTop = `OrderID: ${orderId}\n${waiterName}\n${tableName}\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            const messageTop = `OrderID: ${orderId}\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            // const message = `${messageMap.join('\n')}`;

            // const cashInfo = paidVia === 'CASH' ? `Cash Received: ${cash}\nChange: ${cashChange}` : '';

            // const totalCash = totalOrderCash + totalPosOrderCash;
            // const finalOrder = orderTotal + posOrderTotal;
            const orderAmountTax = orderTotal * (tax / 100);
            const orderTotalExcl = orderTotal - orderAmountTax;
            const mb1 = `Order Total(excl. tax)`;
            const mb1Val = orderTotalExcl.toFixed(2);
            const mb2 = `Tax(${tax}%)`;
            const mb2Val = orderAmountTax.toFixed(2);
            const mb3 = `After Tax`;
            const mb3Val = orderTotal.toFixed(2);
            const mb4 = `Payment Mode`;
            const mb4Val = paidVia;
            const mb5 = `T-ID`;
            const mb5Val = tid;
            // const mb1 = `Order Total`;
            // const mb1Val = orderTotal.toFixed(2);
            // const mb2 = `Tax`;
            // const mb2Val = `${tax}%`
            // const mb3 = `After Tax`;
            // const mb3Val = afterTax.toFixed(2);
            // const mb4 = `Payment Mode`;
            // const mb4Val = paidVia;
            // const mb5 = `T-ID`;
            // const mb5Val = tid;
            // const mb6 = `Cash Received`;
            // const mb6Val = cash;
            // const mb7 = `Change`;
            // const mb7Val = cashChange;

            // const messageBottom = `Order Total: ${orderTotal.toFixed(2)}\nTax: ${tax}%\nAfter Tax: ${afterTax.toFixed(2)}\nPayment Mode: ${paidVia}\nT-ID: ${tid}` + (cashInfo ? `\n${cashInfo}` : '');

            const thank = `THANK YOU`;
            const softwareBy = `software by`;
            const anunzio = `Anunzio International FZC`;
            const website = `www.anunziointernational.com`;
            const number = `+971-58-551-5742`;
            const email = `info@anunziointernational.com`;

            try {
                const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
                // const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

                const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
                const paperWidth = 302;

                const pdf = new PDFDocument({
                    size: [paperWidth, 1200],
                    margin: 10,
                });

                const filePath = 'C:\\Dropbox\\Email Attachments\\'; // Specify the file path
                const fileName = path.basename(filePath);

                // Pipe the PDF directly to the response object
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}\\${restaurant_id}.pdf"`);
                pdf.pipe(res);

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
                                    JOIN pos_order_extras ON menu_extras.extras_id = pos_order_extras.extras_id
                                    WHERE pos_order_extras.PosOrderItemID = ?`;
                    const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

                    const extrasList = extrasResult.length > 0
                        ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
                        : '';
                    const itemName = `${item.quantity} ${item.itemName} ${extrasList}`;
                    const price = `${item.itemPrice.toFixed(2)} ${currency}`;

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
                pdf.text(mb1, 10, pdf.y, { align: 'left' });
                pdf.text(mb1Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
                pdf.text(mb2, 10, pdf.y, { align: 'left' });
                pdf.text(mb2Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
                pdf.text(mb3, 10, pdf.y, { align: 'left' });
                pdf.text(mb3Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
                pdf.text(mb4, 10, pdf.y, { align: 'left' });
                pdf.text(mb4Val, 10, pdf.y - 15, { align: 'right' });
                pdf.text(mb5, 10, pdf.y, { align: 'left' });
                pdf.text(mb5Val, 10, pdf.y - 15, { align: 'right' });
                // pdf.text(mb6, 10, pdf.y, { align: 'left' });
                // pdf.text(mb6Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
                // pdf.text(mb7, 10, pdf.y, { align: 'left' });
                // pdf.text(mb7Val + ' ' + currency, 10, pdf.y - 15, { align: 'right' });
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

                // console.log('Email Sent! and Status updated!: ', info);

                // fs.unlinkSync(pdfPath);
                fs.unlink(pdfPath, (err) => {
                    if (err) {
                        console.error('Error deleting PDF file:', err);
                    } else {
                        console.log('PDF file deleted successfully');
                    }
                });
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

        res.status(200).json({ status: 200, message: 'POS Order status updated to "paid" successfully!' });
    } catch (error) {

        const rollbackTransactionQuery = 'ROLLBACK';
        await poolConnection.query(rollbackTransactionQuery);

        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
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
                menu_extras.extras_price,
                ROW_NUMBER() OVER () AS series
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
                series,
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
                    series,
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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }

};

module.exports = {
    create,
    getAllOrders,
    getOrderById,
    mrkPaid
}