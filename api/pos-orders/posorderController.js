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

            let orderTotal = 0;
            const afterTax = orderDetails.total_amount;
            const paidVia = orderDetails.paid_via;
            const tid = orderDetails.tid;
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

            const itemsArray = [];

            for (const item of orderItems) {
                const itemId = item.PosOrderItemID;
                const itemName = item.ItemName;
                const quantity = item.Quantity;
                const itemPrice = item.Price * quantity;
                orderTotal += itemPrice;

                itemsArray.push({ itemId, itemName, quantity, restaurantName, itemPrice });

            }

            let messageMap = itemsArray.map(async (item) => {
                const extrasQuery = `SELECT menu_extras.extras_name FROM menu_extras
                                    JOIN pos_order_extras ON menu_extras.extras_id = pos_order_extras.extras_id
                                    WHERE order_extras.PosOrderItemID = ?`;
                const extrasResult = await poolConnection.query(extrasQuery, [item.itemId]);

                const extrasList = extrasResult.length > 0
                    ? `(${extrasResult.map(extra => extra.extras_name).join(`, `)})`
                    : '';

                return `${item.quantity} ${item.itemName} ${currency} ${item.itemPrice}\n${extrasList}`;
            });

            messageMap = await Promise.all(messageMap);

            const resName = `${restaurantName}`.toUpperCase();
            const messageTop = `OrderID: ${orderId}\nPOS Order\nDate: ${formattedDate}\nTime: ${formattedTime}\n`;

            const message = `${messageMap.join('\n')}`;

            const messageBottom = `Order Total: ${orderTotal}\nTax: ${tax}%\nAfter Tax: ${afterTax}\nPayment Mode: ${paidVia}\nT-ID: ${tid}`;

            const thank = `THNAK YOU`;

            try {
                const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
                // const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

                const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
                const paperWidth = 303;

                const pdf = new PDFDocument({
                    size: [paperWidth, 600],
                    margin: 12,
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
                pdf.fontSize(12);

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