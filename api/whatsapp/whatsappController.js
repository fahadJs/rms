const { query } = require('express');
const poolConnection = require('../../config/database');

const getAllInstances = async (req, res) => {
    try {
        const rows = await poolConnection.query(`SELECT * FROM WhatsAppInstances WHERE status = 'available'`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching WhatsAppInstances: ${error}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
    }
}

const getAllGroups = async (req, res) => {
    const {restaurant_id} = req.params;
    try {
        const rows = await poolConnection.query(`SELECT * FROM WGroupIds WHERE restaurant_id = ?`,[restaurant_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching WhatsApp Groups: ${error}`);
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
    const { instance_id, w_group_number, KitchenID } = req.body;
    const { restaurant_id }  = req.params;

    try {
        const insertGroupQuery = `INSERT INTO WGroupIds (w_group_number, KitchenID, restaurant_id, instance_id) VALUES (?, ?, ?, ?)`;
        await poolConnection.query(insertGroupQuery, [w_group_number, KitchenID, restaurant_id, instance_id]);

        res.status(200).json({status: 200, message: 'Data inserted successfully!' });
    } catch (error) {

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error inserting data', error: error.message });
    }
};

const updateGroups = async (req, res) => {
    const { w_group_number, w_group_id } = req.body;
    const { restaurant_id }  = req.params;

    try {
        const updateGroupQuery = `UPDATE WGroupIds SET w_group_number = ? WHERE w_group_id = ? AND restaurant_id = ?`;
        await poolConnection.query(updateGroupQuery, [w_group_number, w_group_id, restaurant_id]);

        res.status(200).json({status: 200, message: 'Data updated successfully!' });
    } catch (error) {

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating data', error: error.message });
    }
};

const create = async (req, res) => {

};

module.exports = {
    getAllInstances,
    createGroupIds,
    getAllGroups,
    updateGroups
};