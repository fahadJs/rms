const poolConnection = require('../../config/db');

const getAllCust = async (req, res) => {
    try {
        const getAllNumbers = `SELECT * FROM cust_numbers`;
        const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        res.status(200).json(getAllNumbersResult);

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching Customers!` });
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

const getAllByCust = async (req, res) => {
    try {
        const {custId} = req.params;

        const selectQuery =
            `SELECT cn.cust_id, cn.cust_number, tn.t_num FROM cust_numbers cn LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id WHERE tn.cust_id = ? AND tn.t_status = ?`;

        const rows = await poolConnection.query(selectQuery, [custId, 'assigned']);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: 'Customer not found or no assigned numbers' });
        } else {
            const customerDetails = {
                cust_id: rows[0].cust_id,
                cust_number: rows[0].cust_number,
                assigned_numbers: rows.map((row) => row.t_num),
            };

            res.json({customerDetails });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    getAllCust,
    assignCustomerTask,
    getAllByCust
}