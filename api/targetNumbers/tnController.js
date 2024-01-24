const poolConnection = require('../../config/db');
const axios = require('axios');

const getAllCust = async (req, res) => {
    try {
        const getAllNumbers = `
        SELECT cn.cust_id, cn.cust_number, tn.sent_status
        FROM cust_numbers cn
        LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id
    `;

        const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        const allCustomers = getAllNumbersResult.map(row => ({
            cust_id: row.cust_id,
            cust_number: row.cust_number,
            sent_status: row.sent_status,
        }));

        res.status(200).json(allCustomers);

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching Customers!` });
    }
}

const getAllTargetNumbers = async (req, res) => {
    try {
        const getAllNumbers = `SELECT * FROM target_numbers`;
        const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        res.status(200).json(getAllNumbersResult);

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching Customers!` });
    }
}

const assignCustomerTask = async (req, res) => {
    try {
        const { cust_number } = req.body;

        const checkCustQuery = 'SELECT cust_id FROM cust_numbers WHERE cust_number = ?';
        const checkCustResult = await poolConnection.query(checkCustQuery, [cust_number]);

        if (checkCustResult.length > 0) {
            res.status(409).json({ status: 409, message: 'Cust_number already exists' });
            console.log('Cust_number already exists');
            return;
        } else {
            const insertCustQuery = 'INSERT INTO cust_numbers (cust_number) VALUES (?)';
            const insertCustResult = await poolConnection.query(insertCustQuery, [cust_number]);
            const custId = insertCustResult.insertId;

            const selectQuery = 'SELECT * FROM target_numbers WHERE t_status = ? LIMIT 30';
            const rows = await poolConnection.query(selectQuery, ['not-assigned']);

            const updateQuery = 'UPDATE target_numbers SET t_status = ?, cust_id = ? WHERE t_id IN (?)';
            const tIds = rows.map((row) => row.t_id);

            await poolConnection.query(updateQuery, ['assigned', custId, tIds]);
            res.status(200).json({ status: 200, message: 'Numbers assigned successfully' });
        }
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
        console.log(error);
    }

}

const getAllByCust = async (req, res) => {
    try {
        const { custId } = req.params;

        const selectQuery =
            `SELECT cn.cust_id, cn.cust_number, tn.t_num, tn.t_id, tn.sent_status FROM cust_numbers cn LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id WHERE tn.cust_id = ? AND tn.t_status = ?`;

        const rows = await poolConnection.query(selectQuery, [custId, 'assigned']);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: 'Customer not found or no assigned numbers' });
        }

        const assignedNumbers = rows.map(row => ({ id: row.t_id, number: row.t_num }));

        res.status(200).json({
            cust_id: rows[0].cust_id,
            cust_number: rows[0].cust_number,
            sent_status: rows[0].sent_status,
            assigned_numbers: assignedNumbers
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const sendMessage = async (req, res) => {
    try {
        const { custId } = req.params;

        const selectQuery =
            `SELECT cn.cust_id, cn.cust_number, tn.t_num FROM cust_numbers cn LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id WHERE tn.cust_id = ? AND tn.t_status = ? AND tn.sent_status = ?`;

        const rows = await poolConnection.query(selectQuery, [custId, 'assigned', 'not-sent']);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: 'Customer not found or no assigned numbers or sent task already!' });
            console.log('Customer not found or no assigned numbers or sent task already!');
            return;
        }

        const numbersList = rows.map((row) => row.t_num).join('%0a%0a');
        const message = `Paisay kamanay ka tareeqa yeh hai k:

%0a%0astep 1%0aHumein "250" likh kar message karain.%0a%0a

step 2%0aJo message aap ko receive ho, woh message diay gai neechay number per send kar dain.%0a%0a

Step 3%0aScreen recording kr k 1 ghantay k baad humein bhej dena hai (bank account number or easypaisa or jazz cash)%0a%0aInn numbers per click kar k "hi" ka message karna hai pahlay aur phir message forward karna hai picture k sath wala hai woh apko forward karna hai neechay diay gai number per.%0a%0a

numbers: %0a%0a${numbersList}`;

        console.log(message);

        const custNum = rows[0].cust_number;

        const apiUrl = `https://dash2.wabot.my/api/send.php?number=${custNum}&type=text&message=${message}&instance_id=65AE763FD8BEE&access_token=10cabf6587ee6a7f6f2d3c8659f56c9a`;

        try {
            const apiCall = await axios.get(apiUrl);
            console.log(apiCall.data);

            const updateSentStatus = `UPDATE target_numbers SET sent_status = 'sent' WHERE cust_id = ?`;
            await poolConnection.query(updateSentStatus, [custId]);

            console.log(`Status updated to sent!`);
        } catch (error) {
            console.log(`${error}! Error Making Api Call!`);
            res.status(500).json({ status: 500, message: `Error Making Api Call!` });
            return;
        }

        res.status(200).json({ status: 200, message: `Message succesfully sent!` });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const updateTargetNumbersStatus = async (req, res) => {
    try {
        const { custId } = req.params;
        const { numbers } = req.body;

        const getTargetNumbers = `SELECT * FROM target_numbers WHERE cust_id = ? AND t_status = 'assigned'`;
        const getTargetNumbersResult = await poolConnection.query(getTargetNumbers, [custId]);

        if (getTargetNumbersResult.length > 0) {
            for (const number of numbers) {
                try {
                    const updateNumberStatus = `UPDATE target_numbers SET t_status = 'not-assigned' WHERE t_id = ? AND cust_id = ?`;
                    await poolConnection.query(updateNumberStatus, [number.t_id, custId]);
                    console.log(`Successfully marked not-assigned!`);
                } catch (error) {
                    console.error('Error:', error);
                    res.status(500).json({ status: 500, message: 'Error Updating Number Status!' });
                    return;
                }
            }
        } else {
            console.error('Error:', error);
            res.status(404).json({ status: 404, message: 'No Target number found!' });
            return;
        }

        res.status(200).json({ status: 200, message: `Status Succesfully Marked not-assigned to all!` });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    getAllCust,
    assignCustomerTask,
    getAllByCust,
    getAllTargetNumbers,
    sendMessage,
    updateTargetNumbersStatus
}