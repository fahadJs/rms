const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const getAll = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        const getTimeZoneQuery = `
            SELECT time_zone
            FROM restaurants
            WHERE restaurant_id = ?;
        `;

        const timeZoneResult = await poolConnection.query(getTimeZoneQuery, [restaurant_id]);

        if (!timeZoneResult.length) {
            res.status(400).json({ status: 400, message: 'Restaurant not found' });
            return;
        }

        const restaurantTimeZone = timeZoneResult[0].time_zone;

        const twentyFourHoursAgo = moment.tz(moment(), restaurantTimeZone).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const getCashSalesQuery = `
                SELECT
                o.waiter_id,
                o.paid_via,
                o.after_tax AS cash_amount,
                bs.SplitAmount AS split_amount,
                w.closed_remaining
            FROM
                orders o
            LEFT JOIN
                bill_split_item bs ON o.OrderID = bs.OrderID AND bs.paid_via = 'CASH'
            LEFT JOIN
                waiters w ON o.waiter_id = w.waiter_id
            WHERE
                o.restaurant_id = ? AND
                o.waiter_closed = 'pending' AND
                o.time >= ?;
        `;

        const getCashSalesResult = await poolConnection.query(getCashSalesQuery, [restaurant_id, twentyFourHoursAgo]);

        const totalCashSales = {};
        getCashSalesResult.forEach(result => {
            const waiterId = result.waiter_id;
            if (!totalCashSales[waiterId]) {
                totalCashSales[waiterId] = 0;
            }

            if (result.paid_via && result.paid_via.toLowerCase().includes('cash')) {
                totalCashSales[waiterId] += result.cash_amount;
            } else if (result.paid_via === 'itsplit') {
                totalCashSales[waiterId] += result.split_amount;
            }
        });

        await Promise.all(Object.keys(totalCashSales).map(async waiterId => {
            const getCurrentRemainingQuery = `
                SELECT closed_remaining
                FROM waiters
                WHERE waiter_id = ?;
            `;
            const currentRemainingResult = await poolConnection.query(getCurrentRemainingQuery, [waiterId]);

            const currentRemaining = currentRemainingResult[0].closed_remaining;
            totalCashSales[waiterId] += currentRemaining;

            const updateWaiterQuery = `
                UPDATE waiters
                SET closed_amount = ?,
                    closed_remaining = ?
                WHERE waiter_id = ?;
            `;
            await poolConnection.query(updateWaiterQuery, [totalCashSales[waiterId], currentRemaining, waiterId]);
        }));

        const formattedResults = Object.keys(totalCashSales).map(waiterId => ({
            waiter_id: parseInt(waiterId),
            cash_sales: totalCashSales[waiterId]
        }));

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error(`Error Getting Sales! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error Getting Sales!' });
    }
}

const closing = async (req, res) => {
    try {
        const { restaurant_id, waiter_id, amount } = req.params;

        const getWaiterInfoQuery = `SELECT * FROM waiters WHERE restaurant_id = ? AND waiter_id = ?`;
        const getWaiterInfoResult = await poolConnection.query(getWaiterInfoQuery, [restaurant_id, waiter_id]);

        const closedAmount = getWaiterInfoResult[0].closed_amount;

        const closedRemaining = closedAmount - amount;

        const setClosedRemianingQuery = `UPDATE waiters SET closed_remaining = ? WHERE waiter_id = ? AND restaurant_id = ?`;

        await poolConnection.query(setClosedRemianingQuery, [closedRemaining, waiter_id, restaurant_id]);

        const setClosedRemainingQuery = `
            UPDATE orders
            SET waiter_closed = 'closed'
            WHERE waiter_id = ? AND restaurant_id = ?;
        `;

        await poolConnection.query(setClosedRemainingQuery, [waiter_id, restaurant_id]);

        res.status(200).json({ status: 200, message: 'Closed Updated!' });
    } catch (error) {
        console.error(`Error Closing Sales! Error: ${error}`);
        res.status(500).json({ status: 500, message: 'Error Closing Sales!' });
    }
}


module.exports = {
    getAll,
    closing
}