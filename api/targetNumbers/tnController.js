const poolConnection = require('../../config/db');
const axios = require('axios');

const getAllInfo = async (req, res) => {
    try {
        const assignedCount = await poolConnection.query(`SELECT COUNT(t_status) FROM target_numbers WHERE t_status = 'assigned'`);
        const sentCount = await poolConnection.query(`SELECT COUNT(sent_status) FROM target_numbers WHERE sent_status = 'sent'`);
        const resolvedCount = await poolConnection.query(`SELECT COUNT(resolve_status) FROM target_numbers WHERE resolve_status = 'resolved'`);

        const notAssignedCount = await poolConnection.query(`SELECT COUNT(t_status) FROM target_numbers WHERE t_status = 'not-assigned'`);
        const notSentCount = await poolConnection.query(`SELECT COUNT(sent_status) FROM target_numbers WHERE sent_status = 'not-sent'`);
        const notResolvedCount = await poolConnection.query(`SELECT COUNT(resolve_status) FROM target_numbers WHERE resolve_status = 'not-resolved'`);

        const total = await poolConnection.query(`SELECT COUNT(t_id) FROM target_numbers`);

        res.status(200).json({
            assigned: assignedCount,
            sent: sentCount,
            resolved: resolvedCount,
            notAssigned: notAssignedCount,
            notSent: notSentCount,
            notResolved: notResolvedCount,
            total: total
        });

    } catch (error) {
        res.status(404).json({ status: 404, message: `Error fetching info!` });
    }
}

const getAllCust = async (req, res) => {
    try {
        //     const getAllNumbers = `
        //     SELECT cn.cust_id, cn.cust_number, tn.sent_status, cn.t_status, tn.resolve_status
        //     FROM cust_numbers cn
        //     LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id
        // `;

        //     const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        //     const customerMap = new Map();

        //     getAllNumbersResult.forEach(row => {
        //         const custId = row.cust_id;

        //         if (!customerMap.has(custId)) {
        //             customerMap.set(custId, {
        //                 cust_id: custId,
        //                 cust_number: row.cust_number,
        //                 sent_status: row.sent_status,
        //                 resolve_status: row.resolve_status,
        //                 assign_status: row.t_status
        //             });
        //         }
        //     });

        //     const allCustomers = Array.from(customerMap.values());

        //     res.status(200).json(allCustomers);

        const getAllNumbers = `
    SELECT cn.cust_id, cn.cust_number, tn.sent_status, cn.t_status, tn.resolve_status, tn.visible_status
    FROM cust_numbers cn
    LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id
`;

        const getAllNumbersResult = await poolConnection.query(getAllNumbers);

        const customerMap = new Map();

        getAllNumbersResult.forEach(row => {
            const custId = row.cust_id;

            if (!customerMap.has(custId)) {
                customerMap.set(custId, {
                    cust_id: custId,
                    cust_number: row.cust_number,
                    sent_status: null, // Initialize to null
                    resolve_status: null, // Initialize to null
                    assign_status: row.t_status
                });
            }

            // Update statuses if visible_status is 'visible'
            const existingEntry = customerMap.get(custId);
            if (row.visible_status === 'visible') {
                existingEntry.sent_status = row.sent_status;
                existingEntry.resolve_status = row.resolve_status;
            }
        });

        // Now, make a separate query to get both statuses
        const getStatuses = `
    SELECT cust_id, sent_status, resolve_status
    FROM target_numbers
    WHERE cust_id IN (${Array.from(customerMap.keys()).join(',')})
`;

        const getStatusesResult = await poolConnection.query(getStatuses);

        // Update the existing entries in customerMap with the new statuses
        getStatusesResult.forEach(row => {
            const custId = row.cust_id;
            const existingEntry = customerMap.get(custId);
            existingEntry.sent_status = row.sent_status;
            existingEntry.resolve_status = row.resolve_status;
        });

        const allCustomers = Array.from(customerMap.values());

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

        await poolConnection.query('START TRANSACTION');

        const checkCustQuery = 'SELECT cust_id FROM cust_numbers WHERE cust_number = ?';
        const checkCustResult = await poolConnection.query(checkCustQuery, [cust_number]);

        if (checkCustResult.length > 0) {
            res.status(409).json({ status: 409, message: 'Cust_number already exists' });
            console.log('Cust_number already exists');
        }

        try {
            const insertCustQuery = 'INSERT INTO cust_numbers (cust_number) VALUES (?)';
            const insertCustResult = await poolConnection.query(insertCustQuery, [cust_number]);
            const custId = insertCustResult.insertId;

            const selectQuery = 'SELECT * FROM target_numbers WHERE t_status = ? LIMIT 30';
            const rows = await poolConnection.query(selectQuery, ['not-assigned']);

            const updateQuery = 'UPDATE target_numbers SET t_status = ?, cust_id = ? WHERE t_id IN (?)';
            const tIds = rows.map((row) => row.t_id);
            await poolConnection.query(updateQuery, ['assigned', custId, tIds]);

            const updateAssigned = 'UPDATE cust_numbers SET t_status = ? WHERE cust_id = ?';
            await poolConnection.query(updateAssigned, ['assigned', custId]);

        } catch (error) {
            await poolConnection.query('ROLLBACK');
            console.log(error);
            res.status(500).json({ status: 500, message: 'Internal Server Error' });
        }

        await poolConnection.query('COMMIT');
        res.status(200).json({ status: 200, message: 'Numbers assigned successfully' });

    } catch (error) {
        await poolConnection.query('ROLLBACK');
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
        console.log(error);
    }

}

const reAssignCustomerTask = async (req, res) => {
    try {
        const { custId } = req.params;

        await poolConnection.query('START TRANSACTION');

        const selectQuery = 'SELECT * FROM target_numbers WHERE t_status = ? LIMIT 30';
        const rows = await poolConnection.query(selectQuery, ['not-assigned']);

        const updateQuery = 'UPDATE target_numbers SET t_status = ?, cust_id = ? WHERE t_id IN (?)';

        const tIds = rows.map((row) => row.t_id);
        await poolConnection.query(updateQuery, ['assigned', custId, tIds]);

        const updateAssigned = `UPDATE cust_numbers SET t_status = 'assigned' WHERE cust_id = ?`;
        await poolConnection.query(updateAssigned, [custId]);

        res.status(200).json({ status: 200, message: 'Numbers assigned successfully' });
        await poolConnection.query('COMMIT');
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
        console.log(error);
    }

}

const resolveTask = async (req, res) => {
    try {
        const { custId } = req.params;

        const updateQuery = `UPDATE target_numbers SET resolve_status = 'resolved', SET visible_status = 'hidden' WHERE cust_id = ?`;
        await poolConnection.query(updateQuery, [custId]);

        const updateAssigned = `UPDATE cust_numbers SET t_status = 'not-assigned' WHERE cust_id = ?`;
        await poolConnection.query(updateAssigned, [custId]);

        res.status(200).json({ status: 200, message: 'Numbers resolved successfully' });

    } catch (error) {
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
        console.log(error);
    }
}

const getAllByCust = async (req, res) => {
    try {
        const { custId } = req.params;

        const selectQuery =
            `SELECT cn.cust_id, cn.cust_number, tn.t_num, tn.t_id FROM cust_numbers cn LEFT JOIN target_numbers tn ON cn.cust_id = tn.cust_id WHERE tn.cust_id = ? AND tn.t_status = ? AND tn.resolve_status = ?`;

        const rows = await poolConnection.query(selectQuery, [custId, 'assigned', 'not-resolved']);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: 'Customer not found or no assigned numbers' });
        }

        const assignedNumbers = rows.map(row => ({ id: row.t_id, number: row.t_num }));

        res.status(200).json({
            cust_id: rows[0].cust_id,
            cust_number: rows[0].cust_number,
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
            res.status(404).json({ success: false, message: 'Customer not found or no assigned numbers or sent task already task not resolved!' });
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

            if (apiCall.data.status === 'success') {
                const updateSentStatus = `UPDATE target_numbers SET sent_status = 'sent' WHERE cust_id = ?`;
                await poolConnection.query(updateSentStatus, [custId]);

                console.log(`Status updated to sent!`);
                res.status(200).json({ status: 200, message: `Message successfully sent!` });
            } else {
                const updateSentStatus = `UPDATE target_numbers SET sent_status = 'not-sent' WHERE cust_id = ?`;
                await poolConnection.query(updateSentStatus, [custId]);

                console.log(`Error Making Api Call - Status not success!`);
                res.status(500).json({ status: 500, message: `Error Making Api Call - Status not success!` });
            }
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
    updateTargetNumbersStatus,
    resolveTask,
    reAssignCustomerTask,
    getAllInfo
}