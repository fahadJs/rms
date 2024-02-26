const poolConnection = require('../../config/db');

const test = async (req, res) => {
    try {

        const testQuery = `SELECT * FROM restaurants`;
        const output = await poolConnection.query(testQuery);

        // const testInsertQuery = `INSERT INTO cash_in (narration, amount, time, restaurant_id) VALUES (?, ?, ?, ?);`;
        // const insertOutput = await poolConnection.query(testInsertQuery, ['FROM AWS', '1000000', '0', 1]);

        console.log(`Connection Successful with the cPanel Database`);
        res.status(200).json({status: 200, message: `Connection Successful with the cPanel Database`, result: output});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({status: 500, message: error.message});
    }
}

module.exports = {
    test,
}