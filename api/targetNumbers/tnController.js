const poolConnection = require('../../config/db');

const getAll = async (req, res) => {
    try {
        const getAllNumbers = `SELECT * FROM target_numbers`;
        const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        res.status(200).json(getAllNumbersResult);

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching Numbers!` });
    }
}

const assignCustomerTask = async (req, res) => {
    try {

        const { cust_number } = req.body;

        const insertCustQuery = 'INSERT INTO cust_numbers (cust_number) VALUES (?)';
        const insertCustResult = await poolConnection.query(insertCustQuery, [cust_number]);
        const custId = insertCustResult.insertId;

        const selectQuery = 'SELECT * FROM target_numbers WHERE t_status = ? LIMIT 10';
        const rows = await poolConnection.query(selectQuery, ['not-assigned']);

        const updateQuery = 'UPDATE target_numbers SET t_status = ?, cust_id = ? WHERE t_id IN (?)';
        const tIds = rows.map((row) => row.t_id);

        await poolConnection.query(updateQuery, ['assigned', custId, tIds]);
        res.status(200).json({ status: 200, message: 'Numbers assigned successfully' });

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching Numbers!` });
        console.log(error);
    }
}

module.exports = {
    getAll,
    assignCustomerTask
}