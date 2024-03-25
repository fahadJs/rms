const poolConnection = require('../../config/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const upload = require('../../dropUpload/upload');
const printDaily = require('../summary/sumController');

const getDenominations = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');
        const { restaurant_id } = req.params;

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getTheOrder = `SELECT * FROM orders WHERE time >= ? AND restaurant_id = ?`;
        // const getTheOrder = `SELECT * FROM orders`;
        const getTheOrderRes = await poolConnection.query(getTheOrder, [openingTime, restaurant_id]);
        // const getTheOrderRes = await poolConnection.query(getTheOrder);

        const orderDetails = getTheOrderRes;

        const getThePosOrder = `SELECT * FROM pos_orders WHERE time >= ? AND restaurant_id = ?`;
        // const getThePosOrder = `SELECT * FROM pos_orders`;
        const getThePosOrderRes = await poolConnection.query(getThePosOrder, [openingTime, restaurant_id]);
        // const getThePosOrderRes = await poolConnection.query(getThePosOrder);

        const posOrderDetails = getThePosOrderRes;

        let totalOrderCash = 0

        for (const item of orderDetails) {
            const itemPrice = item.after_tax;
            if (item.paid_via == 'CASH') {
                totalOrderCash += itemPrice;
            }
        }

        let totalPosOrderCash = 0;

        for (const item of posOrderDetails) {
            const itemPrice = item.total_amount;
            if (item.paid_via == 'CASH') {
                totalPosOrderCash += itemPrice;
            }
        }

        const totalCash = totalOrderCash + totalPosOrderCash;

        const getRestaurant = `
            SELECT
                *
            FROM
                denomination_details details
            JOIN
                denomination denom ON details.denom_id = denom.denom_id
            JOIN
                restaurants rest ON rest.denom_id = denom.denom_id
            WHERE
                rest.restaurant_id = ?;
        `;
        const getRestaurantRes = await poolConnection.query(getRestaurant, [restaurant_id]);

        const formattedOutput = {
            restaurant_id: null,
            name: null,
            expected_daily_cash_sale: null,
            denomination_details: []
        };

        if (getRestaurantRes.length > 0) {
            formattedOutput.restaurant_id = getRestaurantRes[0].restaurant_id;
            formattedOutput.name = getRestaurantRes[0].name;
            formattedOutput.expected_daily_cash_sale = totalCash.toFixed(2);

            formattedOutput.denomination_details = getRestaurantRes.map(row => ({
                denom_details_id: row.denom_details_id,
                digit_value: parseFloat(row.digit_value),
                denom_name: row.denom_key,
            }));
        }

        await poolConnection.query('COMMIT');
        res.status(200).json(formattedOutput);
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const posClosing = async (req, res) => {
    try {
        await poolConnection.query(`START TRANSACTION`);

        const { restaurant_id } = req.params;
        const { username, total, items, dailyCostSum } = req.body;

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const getFixedCost = `SELECT * FROM res_fix_cost_monthly WHERE restaurant_id = ?`;
        const getFixedCostRes = await poolConnection.query(getFixedCost, [restaurant_id]);

        if (getFixedCostRes == 0) {
            console.log('Daily Fixed Cost Not Found, Try to Create!');
            throw new Error('Daily Fixed Cost Not Found, Try to Create!');
        }

        const fixedDaily = getFixedCostRes[0].fixedDailyCost + getFixedCostRes[0].currentCost;
        let finalCost = fixedDaily - dailyCostSum;

        if (finalCost < 0) {
            finalCost = 0;
            const updateCurrentCost = `UPDATE res_fix_cost_monthly SET currentCost = ?`;
            await poolConnection.query(updateCurrentCost, [finalCost]);
        } else {
            const updateCurrentCost = `UPDATE res_fix_cost_monthly SET currentCost = currentCost + ?`;
            await poolConnection.query(updateCurrentCost, [finalCost]);
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getTheOrder = `SELECT * FROM orders WHERE time >= ? AND restaurant_id = ?`;
        // const getTheOrder = `SELECT * FROM orders`;
        const getTheOrderRes = await poolConnection.query(getTheOrder, [openingTime, restaurant_id]);
        // const getTheOrderRes = await poolConnection.query(getTheOrder);

        const orderDetails = getTheOrderRes;

        const getThePosOrder = `SELECT * FROM pos_orders WHERE time >= ? AND restaurant_id = ?`;
        // const getThePosOrder = `SELECT * FROM pos_orders`;
        const getThePosOrderRes = await poolConnection.query(getThePosOrder, [openingTime, restaurant_id]);
        // const getThePosOrderRes = await poolConnection.query(getThePosOrder);

        const posOrderDetails = getThePosOrderRes;

        let totalOrderCash = 0

        for (const item of orderDetails) {
            const itemPrice = item.after_tax;
            if (item.paid_via == 'CASH') {
                totalOrderCash += itemPrice;
            }
        }

        let totalPosOrderCash = 0;

        for (const item of posOrderDetails) {
            const itemPrice = item.total_amount;
            if (item.paid_via == 'CASH') {
                totalPosOrderCash += itemPrice;
            }
        }

        const totalCash = totalOrderCash + totalPosOrderCash;
        const diff = totalCash - total;
        console.log(diff);

        if (diff > 0) {
            // await poolConnection.query('START TRANSACTION');

            // const whatsappIntance = `SELECT * FROM WhatsAppInstances;`
            // const whatsappIntanceRes = await poolConnection.query(whatsappIntance);
            // const instance = whatsappIntanceRes[0];

            // const instanceNumber = instance.instance_number;
            // const accessToken = instance.access_token;
            // const groupNumber = `120363199942100759@g.us`;
            // const number = `923331233774`

            // const message = `⚠ *ALERT!*\n\nDifference in Cash Closing found.\nPlease check balance.\n\nDifference: ${diff.toFixed(2)}`;

            // const url = `https://dash3.wabot.my/api/send.php?number=${number}&type=text&message=${encodeURIComponent(message)}&instance_id=${instanceNumber}&access_token=${accessToken}`;

            // const ApiCall = await axios.get(url);
            // await poolConnection.query('COMMIT');
            // console.log(ApiCall.data.status);
            // if (ApiCall.data.status == 'success') {
            //     // res.status(200).json({ status: 200, message: ApiCall.data.message });
            //     // console.log(`Items marked as sent!`);
            //     console.log(ApiCall.data);
            // } else {
            //     throw new Error(ApiCall.data.message);
            // }
            console.log(`Cash Differnece Found!`);
            throw new Error(`Cash difference found! ${diff}`);
        }


        const posClosing = `INSERT INTO pos_closing (time, restaurant_id, username, total) VALUES (?, ?, ?, ?)`;
        const posClosingRes = await poolConnection.query(posClosing, [time, restaurant_id, username, total]);

        const posClosingID = posClosingRes.insertId;

        const posClosingDetails = `INSERT INTO pos_closing_details (pos_closing_id, denom_key, denom_value) VALUES (?, ?, ?)`;

        for (const item of items) {
            const { denomKey, denomValue } = item;
            await poolConnection.query(posClosingDetails, [posClosingID, denomKey, denomValue]);
        }

        await printDaily.printDaily(restaurant_id);

        res.status(201).json({ status: 201, message: `Data Inserted Successfully!` });
        await poolConnection.query(`COMMIT`);
    } catch (error) {
        await poolConnection.query(`ROLLBACK`);
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const posOpening = async (req, res) => {
    try {
        await poolConnection.query(`START TRANSACTION`);

        const { restaurant_id } = req.params;
        const { username, total, items } = req.body;

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const getPosClosing = `
            SELECT
                *
            FROM
                pos_closing pc
            WHERE
                pc.restaurant_id = ?
            ORDER BY
                pc.time DESC
            LIMIT 1;
        `;

        const getPosClosingRes = await poolConnection.query(getPosClosing, [restaurant_id]);
        const lastTotal = getPosClosingRes[0].total;

        const diff = lastTotal - total;
        console.log(diff);

        if (diff > 0) {
            // await poolConnection.query('START TRANSACTION');

            // const whatsappIntance = `SELECT * FROM WhatsAppInstances;`
            // const whatsappIntanceRes = await poolConnection.query(whatsappIntance);
            // const instance = whatsappIntanceRes[0];

            // const instanceNumber = instance.instance_number;
            // const accessToken = instance.access_token;
            // const groupNumber = `120363199942100759@g.us`;
            // const number = `923331233774`

            // const message = `⚠ *ALERT!*\n\nDifference in Cash Opening found.\nPlease check balance.\n\nDifference: ${diff.toFixed(2)}`;

            // const url = `https://dash3.wabot.my/api/send.php?number=${number}&type=text&message=${encodeURIComponent(message)}&instance_id=${instanceNumber}&access_token=${accessToken}`;

            // const ApiCall = await axios.get(url);
            // await poolConnection.query('COMMIT');
            // console.log(ApiCall.data.status);
            // if (ApiCall.data.status == 'success') {
            //     // res.status(200).json({ status: 200, message: ApiCall.data.message });
            //     // console.log(`Items marked as sent!`);
            //     console.log(ApiCall.data);
            // } else {
            //     throw new Error(ApiCall.data.message);
            // }
            console.log(`Cash Differnece Found!`);
            throw new Error(`Cash difference found! ${diff}`);
        }


        const posClosing = `INSERT INTO pos_closing (time, restaurant_id, username, total) VALUES (?, ?, ?, ?)`;
        const posClosingRes = await poolConnection.query(posClosing, [time, restaurant_id, username, total]);

        const posClosingID = posClosingRes.insertId;

        const posClosingDetails = `INSERT INTO pos_closing_details (pos_closing_id, denom_key, denom_value) VALUES (?, ?, ?)`;

        for (const item of items) {
            const { denomKey, denomValue } = item;
            await poolConnection.query(posClosingDetails, [posClosingID, denomKey, denomValue]);
        }

        res.status(201).json({ status: 201, message: `Data Inserted Successfully!` });
        await poolConnection.query(`COMMIT`);
    } catch (error) {
        await poolConnection.query(`ROLLBACK`);
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getPosClosing = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        // const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        // const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        // if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
        //     throw new Error("Time zone not available for the restaurant");
        // }

        // const { time_zone, open_time } = currentDateResult[0];
        // const timeZone = time_zone;

        // // Combine the current date with the opening time
        // const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        // const getTheOrder = `SELECT * FROM orders WHERE time >= ? AND restaurant_id = ?`;
        // // const getTheOrder = `SELECT * FROM orders`;
        // const getTheOrderRes = await poolConnection.query(getTheOrder, [openingTime, restaurant_id]);
        // // const getTheOrderRes = await poolConnection.query(getTheOrder);

        // const orderDetails = getTheOrderRes;

        // const getThePosOrder = `SELECT * FROM pos_orders WHERE time >= ? AND restaurant_id = ?`;
        // // const getThePosOrder = `SELECT * FROM pos_orders`;
        // const getThePosOrderRes = await poolConnection.query(getThePosOrder, [openingTime, restaurant_id]);
        // // const getThePosOrderRes = await poolConnection.query(getThePosOrder);

        // const posOrderDetails = getThePosOrderRes;

        // let totalOrderCash = 0

        // for (const item of orderDetails) {
        //     const itemPrice = item.after_tax;
        //     if (item.paid_via == 'CASH') {
        //         totalOrderCash += itemPrice;
        //     }
        // }

        // let totalPosOrderCash = 0;

        // for (const item of posOrderDetails) {
        //     const itemPrice = item.total_amount;
        //     if (item.paid_via == 'CASH') {
        //         totalPosOrderCash += itemPrice;
        //     }
        // }

        // const totalCash = totalOrderCash + totalPosOrderCash;

        const getPosClosing = `
            SELECT
                pc.restaurant_id,
                pc.total,
                pc.time,
                pc.pos_closing_id
            FROM
                pos_closing pc
            WHERE
                pc.restaurant_id = ?
            ORDER BY
                pc.time DESC
            LIMIT 1;
        `;

        const getPosClosingRes = await poolConnection.query(getPosClosing, [restaurant_id]);

        if (getPosClosingRes.length > 0) {
            const latestClosingRecord = getPosClosingRes[0];
            const { pos_closing_id } = latestClosingRecord;

            const getClosingDetails = `
                SELECT
                    denom_value,
                    denom_key
                FROM
                    pos_closing_details
                WHERE
                    pos_closing_id = ?
            `;

            const closingDetailsRes = await poolConnection.query(getClosingDetails, [pos_closing_id]);

            const formattedDetails = closingDetailsRes.map(detail => ({
                pos_closing_id: pos_closing_id,
                denom_value: detail.denom_value,
                denom_key: detail.denom_key
            }));

            latestClosingRecord.pos_closing_details = formattedDetails;

            res.status(200).json(latestClosingRecord);
        } else {
            res.status(404).json({ status: 404, message: "No closing record found after the opening time." });
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const cashIn = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const { narration, amount, type } = req.body;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const typeCap = type.toUpperCase();

        const cashIn = `INSERT INTO cash_in (time, narration, amount, restaurant_id, type) VALUES (?, ?, ?, ?, ?);`;
        await poolConnection.query(cashIn, [time, narration, amount, restaurant_id, typeCap]);

        if (typeCap == 'CASH') {
            const updateBalance = `UPDATE payment_methods SET closing_balance = closing_balance + ? WHERE p_name = ? AND restaurant_id = ?`;
            await poolConnection.query(updateBalance, [amount, typeCap, restaurant_id]);
            console.log(`Cash added! ${amount}`);
        }

        res.status(201).json({ status: 201, message: 'Data Inserted successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const cashOut = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const { narration, amount, type } = req.body;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const typeCap = type.toUpperCase();

        const cashOut = `INSERT INTO cash_out (time, narration, amount, restaurant_id, type) VALUES (?, ?, ?, ?, ?);`;
        await poolConnection.query(cashOut, [time, narration, amount, restaurant_id, typeCap]);

        if (typeCap == 'CASH') {
            const updateBalance = `UPDATE payment_methods SET closing_balance = closing_balance - ? WHERE p_name = ? AND restaurant_id = ?`;
            await poolConnection.query(updateBalance, [amount, typeCap, restaurant_id]);
            console.log(`Cash added! ${amount}`);
        }

        res.status(201).json({ status: 201, message: 'Data Inserted successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getCashIn = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getCashIn = `
            SELECT
                *
            FROM
                cash_in
            WHERE
                restaurant_id = ? AND
                type = 'CASH' AND
                time >= ?
            ORDER BY
                time DESC;
        `;
        const getCashInRes = await poolConnection.query(getCashIn, [restaurant_id, openingTime]);

        res.status(200).json(getCashInRes);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getCashOut = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getCashOut = `
            SELECT
                *
            FROM
                cash_out
            WHERE
                restaurant_id = ? AND
                type = 'CASH' AND
                time >= ?
            ORDER BY
                time DESC;
        `;
        const getCashOutRes = await poolConnection.query(getCashOut, [restaurant_id, openingTime]);

        res.status(200).json(getCashOutRes);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const openCashDrawer = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        try {
            // const to = `habit.beauty.where.unique.protect@addtodropbox.com`;
            // const to = `furnace.sure.nurse.street.poet@addtodropbox.com`;

            const pdfPath = `${restaurant_id}${restaurant_id}${restaurant_id}.pdf`;
            const paperWidth = 288;

            const pdf = new PDFDocument({
                size: [paperWidth, 700],
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

            pdf.pipe(fs.createWriteStream(pdfPath));
            pdf.fontSize(12);

            // pdf.moveDown();
            drawDottedLine(pdf.y, paperWidth);
            pdf.moveDown();

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

            console.log('Cash Drawer Opened!');

            fs.unlinkSync(pdfPath);

            res.status(200).json({ status: 200, message: 'Cash Drawer Opened!' });
        } catch (error) {
            console.log(error);
            return;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getCashInOfPaymentMethod = async (req, res) => {
    try {
        const { restaurant_id, p_name } = req.params;

        const nameUpper = p_name.toUpperCase();
        console.log(nameUpper);

        const getCashInOfPaymentMethod = `SELECT * FROM cash_in WHERE type = ? AND restaurant_id = ?`;
        const getCashInOfPaymentMethodRes = await poolConnection.query(getCashInOfPaymentMethod, [nameUpper, restaurant_id]);

        if (getCashInOfPaymentMethodRes.length === 0) {
            console.log(`No record found for ${nameUpper}!`);
            res.status(404).json({ status: 404, message: `No record found for ${nameUpper}!` });
            return;
        }
        res.status(200).json(getCashInOfPaymentMethodRes);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getCashOutOfPaymentMethod = async (req, res) => {
    try {
        const { restaurant_id, p_name } = req.params;

        const nameUpper = p_name.toUpperCase();

        const getCashOutOfPaymentMethod = `SELECT * FROM cash_out WHERE type = ? AND restaurant_id = ?`;
        const getCashOutOfPaymentMethodRes = await poolConnection.query(getCashOutOfPaymentMethod, [nameUpper, restaurant_id]);

        if (getCashOutOfPaymentMethodRes.length === 0) {
            console.log(`No record found for ${nameUpper}!`);
            res.status(404).json({ status: 404, message: `No record found for ${nameUpper}!` });
            return;
        }
        res.status(200).json(getCashOutOfPaymentMethodRes);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const differenceAlert = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');
        const whatsappIntance = `SELECT * FROM WhatsAppInstances;`
        const whatsappIntanceRes = await poolConnection.query(whatsappIntance);
        const instance = whatsappIntanceRes[0];

        const instanceNumber = instance.instance_number;
        const accessToken = instance.access_token;
        const groupNumber = `120363199942100759@g.us`;
        const number = `923331233774`

        const message = `⚠ *ALERT!*\n\nDifference in sales found.\nPlease check balance.`;

        const url = `https://dash3.wabot.my/api/send.php?number=${number}&type=text&message=${encodeURIComponent(message)}&instance_id=${instanceNumber}&access_token=${accessToken}`;

        // try {

        // } catch (error) {
        //     console.log(error);
        // }

        const ApiCall = await axios.get(url);
        await poolConnection.query('COMMIT');
        console.log(ApiCall.data.status);
        if (ApiCall.data.status == 'success') {
            res.status(200).json({ status: 200, message: ApiCall.data.message });
            // console.log(`Items marked as sent!`);
            console.log(ApiCall.data);
        } else {
            throw new Error(ApiCall.data.message);
        }
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getDenominations,
    posClosing,
    posOpening,
    getPosClosing,
    cashIn,
    cashOut,
    getCashIn,
    getCashOut,
    openCashDrawer,
    getCashInOfPaymentMethod,
    getCashOutOfPaymentMethod,
    differenceAlert
}