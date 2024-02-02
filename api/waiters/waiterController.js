const poolConnection = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const create = async (req, res) => {
    try {
        const { waiter_name, login_id, login_pass, restaurant_id } = req.body;

        const checkWaiterQuery = 'SELECT COUNT(*) AS count FROM waiters WHERE login_id = ?';
        const checkWaiterValues = [login_id];
        const result = await poolConnection.query(checkWaiterQuery, checkWaiterValues);

        if (result[0].count > 0) {
            console.log('Waiter with the same login_id already exists');
            res.status(409).json({ status: 409, message: 'Waiter with the same login_id already exists' });
        } else {
            const insertWaiterQuery = 'INSERT INTO waiters (waiter_name, login_id, login_pass, restaurant_id) VALUES (?, ?, ?, ?)';
            const insertWaiterValues = [waiter_name, login_id, login_pass, restaurant_id];
            await poolConnection.query(insertWaiterQuery, insertWaiterValues);

            res.status(201).json({ status: 201, message: 'Waiter created successfully!' });
        }
    } catch (error) {
        console.error(`Error creating waiter! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error creating waiter!' });
    }
}

const wLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getWaiterQuery = 'SELECT * FROM waiters WHERE login_id = ?';
        const result = await poolConnection.query(getWaiterQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({ status: 404, message: 'Waiter not found!' });
            return;
        }
        const waiter = result[0];

        const getRestaurantQuery = 'SELECT * FROM restaurants WHERE restaurant_id = ?';
        const restaurantResult = await poolConnection.query(getRestaurantQuery, [waiter.restaurant_id]);

        const restaurants = restaurantResult[0];

        const timeZone = restaurants.time_zone;
        const open_time = restaurants.open_time;
        const time = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        if (waiter.status != "allowed") {
            res.status(400).json({ status: 400, message: 'Waiter is not allowed!' });
            return;
        }

        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const getDailyCashSalesQuery = `
        SELECT
            o.paid_via,
            o.after_tax AS cash_amount,
            bs.SplitAmount AS split_amount
        FROM
            orders o
        LEFT JOIN
            bill_split_item bs ON o.OrderID = bs.OrderID AND bs.paid_via = 'CASH'
        WHERE
            o.restaurant_id = ? AND
            o.time >= ?;
    `;

        const getMonthlyCashSalesQuery = `
        SELECT
            o.paid_via,
            o.after_tax AS cash_amount,
            bs.SplitAmount AS split_amount
        FROM
            orders o
        LEFT JOIN
            bill_split_item bs ON o.OrderID = bs.OrderID AND bs.paid_via = 'CASH'
        WHERE
            o.restaurant_id = ? AND
            o.time >= ?;
    `;

        const getDailyCashSalesResult = await poolConnection.query(getDailyCashSalesQuery, [waiter.restaurant_id, openingTime]);
        const getMonthlyCashSalesResult = await poolConnection.query(getMonthlyCashSalesQuery, [waiter.restaurant_id, startOfMonth]);

        let totalDailyCashSales = 0;
        let totalMonthlyCashSales = 0;

        getDailyCashSalesResult.forEach(result => {
            if (result.paid_via && result.paid_via.toLowerCase().includes('cash')) {
                totalDailyCashSales += result.cash_amount;
            } else if (result.paid_via === 'itsplit') {
                totalDailyCashSales += result.split_amount;
            }
        });

        getMonthlyCashSalesResult.forEach(result => {
            if (result.paid_via && result.paid_via.toLowerCase().includes('cash')) {
                totalMonthlyCashSales += result.cash_amount;
            } else if (result.paid_via === 'itsplit') {
                totalMonthlyCashSales += result.split_amount;
            }
        });

        // const passwordMatch = await bcrypt.compare(login_pass, waiter.login_pass);

        if (waiter.login_pass === login_pass) {
            const tokenPayload = {
                waiter_id: waiter.waiter_id,
                restaurant_id: waiter.restaurant_id || null,
                waiter_name: waiter.waiter_name,
                currency: restaurants.default_currency,
                restaurant_name: restaurants.name,
                tax: restaurants.tax,
                time: time,
                daily_cash_sales: totalDailyCashSales,
                monthly_cash_sales: totalMonthlyCashSales,
            };

            const token = jwt.sign(tokenPayload, 'RMSIDVERFY', { expiresIn: '6h' });

            res.status(200).json({
                status: 200,
                message: 'Login successful!',
                waiter_id: tokenPayload.waiter_id,
                restaurant_id: tokenPayload.restaurant_id,
                waiter_name: tokenPayload.waiter_name,
                currency: tokenPayload.currency,
                restaurant_name: tokenPayload.restaurant_name,
                tax: tokenPayload.tax,
                time: tokenPayload.time,
                daily_cash_sales: totalDailyCashSales,
                monthly_cash_sales: totalMonthlyCashSales,
                token,
            });
        } else {
            res.status(401).json({ status: 401, message: 'Incorrect password!' });
        }
    } catch (error) {
        console.error(`Error logging in! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error logging in!' });
    }
}

const getAll = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const getWaitersQuery = 'SELECT * FROM waiters WHERE restaurant_id = ?';
        const waiters = await poolConnection.query(getWaitersQuery, [restaurant_id]);

        res.status(200).json(waiters);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching waiters!' });
    }
}

const getById = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const getWaiterQuery = 'SELECT * FROM waiters WHERE waiter_id = ?';
        const result = await poolConnection.query(getWaiterQuery, [waiterId]);

        if (result.length === 0) {
            res.status(404).json({ status: 404, message: 'Waiter not found!' });
            return;
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error(`Error fetching waiter! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error fetching waiter!' });
    }
}

const update = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const { waiter_name, login_id, login_pass, restaurant_id, status } = req.body;

        // const hashedPassword = await bcrypt.hash(login_pass, 10);

        const updateWaiterQuery = 'UPDATE waiters SET waiter_name = ?, login_id = ?, login_pass = ?, status = ? WHERE waiter_id = ? AND restaurant_id = ?';
        const updateWaiterValues = [waiter_name, login_id, login_pass, status, waiterId, restaurant_id];
        await poolConnection.query(updateWaiterQuery, updateWaiterValues);

        res.status(200).json({ status: 200, message: 'Waiter updated successfully!' });
    } catch (error) {
        console.error(`Error updating waiter! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error updating waiter!' });
    }
}

const passwordReset = async (req, res) => {
    try {
        const { waiter_id, restaurant_id, new_pass } = req.params;

        // const hashedPassword = await bcrypt.hash(new_pass, 10);

        const updatePassQuery = 'UPDATE waiters SET login_pass = ? WHERE waiter_id = ? AND restaurant_id = ?';
        const updatePassValues = [new_pass, waiter_id, restaurant_id];
        await poolConnection.query(updatePassQuery, updatePassValues);

        res.status(200).json({ status: 200, message: 'Password updated successfully!' });
    } catch (error) {
        console.error(`Error updating Password! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error updating Password!' });
    }
}

const wdelete = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const deleteWaiterQuery = 'DELETE FROM waiters WHERE waiter_id = ?';
        await poolConnection.query(deleteWaiterQuery, [waiterId]);

        res.status(200).json({ status: 200, message: 'Waiter deleted successfully!' });
    } catch (error) {
        console.error(`Error deleting waiter! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error deleting waiter!' });
    }
}


module.exports = {
    create,
    wLogin,
    getAll,
    getById,
    update,
    wdelete,
    passwordReset
}