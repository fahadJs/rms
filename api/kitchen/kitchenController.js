const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {

        const {restaurant_id} = req.params;
        const getKitchensQuery = 'SELECT * FROM kitchens WHERE restaurant_id = ?';
        const kitchens = await poolConnection.query(getKitchensQuery, [restaurant_id]);

        if (kitchens.length === 0) {
            return res.status(404).json({status: 404, message: 'Kitchen not found!' });
        }

        res.status(200).json(kitchens);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching kitchens!' });
    }
};

const create = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const { name } = req.body;

        const addKitchenQuery = 'INSERT INTO kitchens (Name, restaurant_id) VALUES (?, ?)';
        const addKitchenValues = [name, restaurant_id];

        await poolConnection.query(addKitchenQuery, addKitchenValues);

        res.status(201).json({status: 201, message: 'Kitchen added successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error adding kitchen!' });
    }
};

const update = async (req, res) => {
    try {
        const {kitchenId, restaurant_id} = req.params;
        const { name } = req.body;

        const updateKitchenQuery = 'UPDATE kitchens SET Name = ? WHERE KitchenID = ? AND restaurant_id = ?';
        const updateKitchenValues = [name, kitchenId, restaurant_id];

        await poolConnection.query(updateKitchenQuery, updateKitchenValues);

        res.status(200).json({status: 200, message: 'Kitchen updated successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating kitchen!' });
    }
};

const remove = async (req, res) => {
    try {
        const {kitchenId, restaurant_id} = req.params;

        const deleteKitchenQuery = 'DELETE FROM kitchens WHERE KitchenID = ? AND restaurant_id = ?';
        const deleteKitchenValues = [kitchenId, restaurant_id];

        await poolConnection.query(deleteKitchenQuery, deleteKitchenValues);

        res.status(200).json({status: 200, message: 'Kitchen deleted successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting kitchen!' });
    }
};

const getById = async (req, res) => {
    try {
        const {kitchenId, restaurant_id} = req.params;

        // Fetch the kitchen details by ID
        const getKitchenQuery = 'SELECT * FROM kitchens WHERE KitchenID = ? AND restaurant_id = ?';
        const kitchenResult = await poolConnection.query(getKitchenQuery, [kitchenId, restaurant_id]);

        if (kitchenResult.length === 0) {
            return res.status(404).json({status: 404, message: 'Kitchen not found!' });
        }

        const kitchenDetails = kitchenResult[0];
        res.status(200).json(kitchenDetails);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching kitchen details!' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}