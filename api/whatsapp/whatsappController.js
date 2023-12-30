const poolConnection = require('../../config/database');

const getAllInstances = async (req, res) => {
    try {
        // Fetch data from the database
        const rows = await poolConnection.query('SELECT * FROM WhatsAppInstances');

        // Send the data as a JSON response
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching WhatsAppInstances: ${error}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }
}

const createGroupIds = async (req, res) => {
    const { instance_id, w_group_number, KitchenID } = req.body;
    const restaurant_id  = req.params;

    try {
        // Start a transaction
        await executeQuery('START TRANSACTION');

        // Insert into WGroupIds table
        const insertGroupQuery = 'INSERT INTO WGroupIds (w_group_number) VALUES (?)';
        const [groupInsertResult] = await executeQuery(insertGroupQuery, [w_group_number]);

        // Get the generated w_group_id
        const w_group_id = groupInsertResult.insertId;

        // Insert into w_message_connection table
        const insertConnectionQuery = `
            INSERT INTO w_message_connection (instance_id, w_group_id, KitchenID, restaurant_id)
            VALUES (?, ?, ?, ?)
        `;
        await executeQuery(insertConnectionQuery, [instance_id, w_group_id, KitchenID, restaurant_id]);

        // Commit the transaction
        await executeQuery('COMMIT');

        res.status(200).json({status: 200, message: 'Data inserted successfully!' });
    } catch (error) {
        // Rollback the transaction in case of an error
        await executeQuery('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error inserting data', error: error.message });
    }
};

const update = async (req, res) => {

};

const create = async (req, res) => {

};

module.exports = {
    getAllInstances,
    createGroupIds
};