const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const getDenominations = async (req, res) => {
    try {
        // await poolConnection.query('START TRANSACTION');
        const { restaurant_id } = req.params;

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
            denomination_details: []
        };

        if (getRestaurantRes.length > 0) {
            formattedOutput.restaurant_id = getRestaurantRes[0].restaurant_id;
            formattedOutput.name = getRestaurantRes[0].name;

            formattedOutput.denomination_details = getRestaurantRes.map(row => ({
                denom_details_id: row.denom_details_id,
                digit_value: parseFloat(row.digit_value),
                denom_name: row.denom_key,
            }));
        }

        res.status(200).json(formattedOutput);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const posClosing = async (req, res) => {
    try {
        await poolConnection.query(`START TRANSACTION`);

        const { restaurant_id } = req.params;
        const { username, total, items } = req.body;

        const timeZoneQuery = 'SELECT time_zone FROM restaurants WHERE restaurant_id = ?';
        const timeZoneResult = await poolConnection.query(timeZoneQuery, [restaurant_id]);

        const timeZone = timeZoneResult[0].time_zone;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

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

        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurant_id]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getPosClosing = `
            SELECT
                *
            FROM
                pos_closing_details pcd
            JOIN
                pos_closing pc ON pcd.pos_closing_id = pc.pos_closing_id
            WHERE
                pc.time >= ? AND restaurant_id = ?
            ORDER BY
                pc.time;
        `;

        const getPosClosingRes = await poolConnection.query(getPosClosing, [open_time, restaurant_id]);

        const formattedOutput = {
            restaurant_id: null,
            total: null,
            time: null,
            pos_closing_details: []
        };

        if (getPosClosingRes.length > 0) {
            formattedOutput.restaurant_id = getPosClosingRes[0].restaurant_id;
            formattedOutput.total = getPosClosingRes[0].total;
            formattedOutput.time = getPosClosingRes[0].time;

            formattedOutput.pos_closing_details = getPosClosingRes.map(row => ({
                pos_closing_id: row.pos_closing_id,
                denom_value: row.denom_value,
                denom_key: row.denom_key,
            }));
        }

        res.status(200).json(formattedOutput);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getDenominations,
    posClosing,
    getPosClosing
}