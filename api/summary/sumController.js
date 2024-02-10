const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const printDaily = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        const timeZoneQuery = 'SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const open_time = timeZoneResult[0].open_time;

        const formattedDate = moment.tz(timeZone).format('YYYY-MM-DD');
        const formattedTime = moment.tz(timeZone).format('HH:mm:ss');
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        // const getTheOrder = `SELECT * FROM orders WHERE time >= ?`;
        const getTheOrder = `SELECT * FROM orders`;
        // const getTheOrderRes = await poolConnection.query(getTheOrder, [openingTime]);
        const getTheOrderRes = await poolConnection.query(getTheOrder);

        const orderDetails = getTheOrderRes;

        // const getThePosOrder = `SELECT * FROM pos_orders WHERE time >= ?`;
        const getThePosOrder = `SELECT * FROM pos_orders`;
        // const getThePosOrderRes = await poolConnection.query(getThePosOrder, [openingTime]);
        const getThePosOrderRes = await poolConnection.query(getThePosOrder);

        const posOrderDetails = getThePosOrderRes;

        const restaurantQuery = `SELECT * FROM restaurants WHERE restaurant_id = ?`;
        const restaurantResult = await poolConnection.query(restaurantQuery, [restaurant_id]);

        const restaurantName = restaurantResult[0].name;
        const tax = restaurantResult[0].tax;
        const currency = restaurantResult[0].default_currency;
        const contact = restaurantResult[0].contact;
        const site = restaurantResult[0].site;

        const itemsArray = [];
        let orderTotal = 0;

        for (const item of orderDetails) {
            const itemPrice = item.total_amount;
            const itemId = item.OrderID;
            orderTotal += itemPrice;

            itemsArray.push({ itemId, itemPrice });
        }

        const posItemsArray = [];
        let posOrderTotal = 0;

        for (const item of posOrderDetails) {
            const itemPrice = item.total_amount;
            const itemId = item.PosOrderID;
            posOrderTotal += itemPrice;

            posItemsArray.push({ itemId, itemPrice });
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
        const messageTop = `Date: ${formattedDate}\nTime: ${formattedTime}\nThis summary of orders are after the opening time of the restaurant!\nOpening time: ${open_time}\n`;

        // const message = `${messageMap.join('\n')}`;

        // const cashInfo = paidVia === 'CASH' ? `Cash Received: ${cash}\nChange: ${cashChange}` : '';

        const finalOrder = orderTotal + posOrderTotal;
        const orderAmountTax = finalOrder * (tax / 100);
        const orderTotalExcl = finalOrder - orderAmountTax;
        const mb1 = `Order Total(excl. tax)`;
        const mb1Val = orderTotalExcl.toFixed(2);
        const mb2 = `Tax(${tax}%)`;
        const mb2Val = orderAmountTax.toFixed(2);
        const mb3 = `After Tax`;
        const mb3Val = finalOrder.toFixed(2);
        // const messageBottom = `Order Total(excl. tax): ${orderTotalExcl.toFixed(2)}\nTax: ${orderAmountTax.toFixed(2)}\nAfter Tax: ${finalOrder.toFixed(2)}`;

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
            centerText(contact, 16);
            // pdf.moveDown();
            centerText(site, 16);
            // pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);

            pdf.moveDown();
            pdf.text(messageTop);
            pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);

            pdf.moveDown();
            pdf.text('Waiter Orders!');
            pdf.moveDown();
            // drawDottedLine(pdf.y, paperWidth);

            for (const item of itemsArray) {
                const itemName = `Order: #${item.itemId}`;
                const price = `${item.itemPrice.toFixed(2)} ${currency}`;

                const priceY = pdf.y - 1;

                // pdf.moveDown();
                pdf.text(itemName, 10, pdf.y, { align: 'left' });
                pdf.text(price, 10, priceY, { align: 'right' });
                // pdf.moveTo(10, pdf.y).lineTo(paperWidth - 10, pdf.y).stroke();
            }

            pdf.moveDown();
            pdf.text('POS Orders!');
            pdf.moveDown();
            // drawDottedLine(pdf.y, paperWidth);

            for (const item of posItemsArray) {
                const itemName = `Order: #${item.itemId}`;
                const price = `${item.itemPrice.toFixed(2)} ${currency}`;

                const priceY = pdf.y - 1;

                // pdf.moveDown();
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
        } catch (error) {
            console.log(error);
            return;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    printDaily
}