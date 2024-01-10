const poolConnection = require('../../config/database');

const getAllBots = async (req, res) => {
    try {
        const rows = await poolConnection.query(`SELECT * FROM TBotId WHERE status = 'available'`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching Bots: ${error}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }

}

const getAllGroups = async (req, res) => {
    const {restaurant_id} = req.params;
    try {
        const rows = await poolConnection.query(`SELECT * FROM TGroupIds WHERE restaurant_id = ?`,[restaurant_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching Telegram Groups: ${error}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }
}

// const createInstances = async (req, res) => {
//     try {
//         const rows = await poolConnection.query(`SELECT * FROM WhatsAppInstances WHERE status = 'available'`);
//         res.status(200).json(rows);
//     } catch (error) {
//         console.error(`Error fetching WhatsAppInstances: ${error}`);
//         res.status(500).json({status: 500, message: 'Internal Server Error' });
//     }
// }

const createGroupIds = async (req, res) => {
    const { bot_id, t_group_number, KitchenID } = req.body;
    const { restaurant_id }  = req.params;

    try {
        const insertGroupQuery = `INSERT INTO TGroupIds (t_group_number, KitchenID, restaurant_id, bot_id) VALUES (?, ?, ?, ?)`;
        await poolConnection.query(insertGroupQuery, [t_group_number, KitchenID, restaurant_id, bot_id]);

        res.status(200).json({status: 200, message: 'Data inserted successfully!' });
    } catch (error) {

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error inserting data', error: error.message });
    }
};

const updateGroups = async (req, res) => {
    const { t_group_number, t_group_id } = req.body;
    const { restaurant_id }  = req.params;

    try {
        const updateGroupQuery = `UPDATE TGroupIds SET t_group_number = ? WHERE t_group_id = ? AND restaurant_id = ?`;
        await poolConnection.query(updateGroupQuery, [t_group_number, t_group_id, restaurant_id]);

        res.status(200).json({status: 200, message: 'Data updated successfully!' });
    } catch (error) {

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating data', error: error.message });
    }
};

const create = async (req, res) => {

};

module.exports = {
    getAllBots,
    createGroupIds,
    getAllGroups,
    updateGroups
};