const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const getAll = async (req, res) => {
    // try {
    //     const { waiter_id, restaurant_id } = req.params;

    //     const getTimeZoneQuery = `
    //         SELECT time_zone, open_time
    //         FROM restaurants
    //         WHERE restaurant_id = ?;
    //     `;

    //     const timeZoneResult = await poolConnection.query(getTimeZoneQuery, [restaurant_id]);

    //     if (!timeZoneResult.length) {
    //         res.status(400).json({ status: 400, message: 'Restaurant not found' });
    //         return;
    //     }

    //     const { time_zone, open_time } = timeZoneResult[0];
    //     const timeZone = time_zone;

    //     const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

    //     const getCashSalesQuery = `
    //         SELECT
    //             o.waiter_id,
    //             o.paid_via,
    //             o.after_tax AS cash_amount,
    //             bs.SplitAmount AS split_amount,
    //             w.closed_remaining
    //         FROM
    //             orders o
    //         LEFT JOIN
    //             bill_split_item bs ON o.OrderID = bs.OrderID AND bs.paid_via = 'CASH'
    //         LEFT JOIN
    //             waiters w ON o.waiter_id = w.waiter_id
    //         WHERE
    //             o.restaurant_id = ? AND
    //             (o.waiter_closed = 'pending' OR o.waiter_closed = 'closed-r') AND
    //             o.time >= ?;
    //     `;

    //     const getCashSalesResult = await poolConnection.query(getCashSalesQuery, [restaurant_id, openingTime]);

    //     const totalCashSales = {};
    //     getCashSalesResult.forEach(result => {
    //         const waiterId = result.waiter_id;
    //         if (!totalCashSales[waiterId]) {
    //             totalCashSales[waiterId] = 0;
    //         }

    //         if (result.paid_via && result.paid_via.toLowerCase().includes('cash')) {
    //             totalCashSales[waiterId] += result.cash_amount;
    //         } else if (result.paid_via === 'itsplit') {
    //             totalCashSales[waiterId] += result.split_amount;
    //         }
    //     });

    //     await Promise.all(Object.keys(totalCashSales).map(async waiterId => {
    //         const updateWaiterQuery = `
    //             UPDATE waiters
    //             SET closed_amount = ?
    //             WHERE waiter_id = ?;
    //         `;
    //         await poolConnection.query(updateWaiterQuery, [totalCashSales[waiterId], waiterId]);
    //     }));

    //     const formattedResults = Object.keys(totalCashSales).map(waiterId => ({
    //         waiter_id: parseInt(waiterId),
    //         cash_sales: totalCashSales[waiterId]
    //     }));

    //     res.status(200).json(formattedResults);
    // } catch (error) {
    //     console.error(`Error Getting Sales! Error: ${error}`);
    //     res.status(500).json({ status: 500, message: 'Error Getting Sales!' });
    // }

    try {
        const { waiter_id, restaurant_id } = req.params;

        const getWaiters = `SELECT * FORM waiters WHERE waiter_id = ? AND restaurant_id = ?`;
        const getWaitersRes = await poolConnection.query(getWaiters, [waiter_id, restaurant_id]);

        const getTimeZoneQuery = `
            SELECT time_zone, open_time
            FROM restaurants
            WHERE restaurant_id = ?;
        `;

        const timeZoneResult = await poolConnection.query(getTimeZoneQuery, [restaurant_id]);

        if (!timeZoneResult.length) {
            res.status(404).json({ status: 404, message: 'Restaurant not found' });
            return;
        }

        const { time_zone, open_time } = timeZoneResult[0];
        const timeZone = time_zone;

        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        for (const waiter of getWaitersRes) {
            const getCashSales = `
                SELECT
                    o.paid_via,
                    o.after_tax AS cash_amount,
                    bs.SplitAmount AS split_amount,
                FROM
                    orders o
                LEFT JOIN
                    bill_split_item bs ON o.OrderID = bs.OrderID AND bs.paid_via = 'CASH'
                WHERE
                    o.restaurant_id = ? AND
                    (o.waiter_closed = 'pending' OR o.waiter_closed = 'closed-r') AND
                    o.time >= ?;
            `;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const closing = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');
        const { restaurant_id, waiter_id, amount } = req.params;

        const getWaiterInfoQuery = `SELECT * FROM waiters WHERE restaurant_id = ? AND waiter_id = ?`;
        const getWaiterInfoResult = await poolConnection.query(getWaiterInfoQuery, [restaurant_id, waiter_id]);

        const closedAmount = getWaiterInfoResult[0].closed_remaining;

        if (amount > closedAmount) {
            return res.status(400).json({ status: 400, message: 'Amount exceeds!' });
        }

        const closedRemaining = closedAmount - amount;

        const setClosedRemainingQuery = `UPDATE waiters SET closed_remaining = ? WHERE waiter_id = ? AND restaurant_id = ?`;

        await poolConnection.query(setClosedRemainingQuery, [closedRemaining, waiter_id, restaurant_id]);

        const setClosedQuery = `
            UPDATE orders
            SET waiter_closed = ?
            WHERE waiter_id = ? AND restaurant_id = ?;
        `;

        const orderStatus = closedRemaining > 0 ? 'closed-r' : 'closed';

        await poolConnection.query(setClosedQuery, [orderStatus, waiter_id, restaurant_id]);

        await poolConnection.query('COMMIT');
        res.status(200).json({ status: 200, message: 'Closed Updated!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}


module.exports = {
    getAll,
    closing
}