const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const getKitchensQuery = 'SELECT * FROM kitchens';
        const kitchens = await poolConnection.query(getKitchensQuery);

        res.status(200).json(kitchens);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching kitchens!' });
    }
};

const create = async (req, res) => {
    try {
        const { name } = req.body;

        const addKitchenQuery = 'INSERT INTO kitchens (Name) VALUES (?)';
        const addKitchenValues = [name];

        await poolConnection.query(addKitchenQuery, addKitchenValues);

        res.status(201).json({status: 201, message: 'Kitchen added successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error adding kitchen!' });
    }
};

const update = async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const { name } = req.body;

        const updateKitchenQuery = 'UPDATE kitchens SET Name = ? WHERE KitchenID = ?';
        const updateKitchenValues = [name, kitchenId];

        await poolConnection.query(updateKitchenQuery, updateKitchenValues);

        res.status(200).json({status: 200, message: 'Kitchen updated successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating kitchen!' });
    }
};

const remove = async (req, res) => {
    try {
        const kitchenId = req.params.id;

        const deleteKitchenQuery = 'DELETE FROM kitchens WHERE KitchenID = ?';
        const deleteKitchenValues = [kitchenId];

        await poolConnection.query(deleteKitchenQuery, deleteKitchenValues);

        res.status(200).json({status: 200, message: 'Kitchen deleted successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting kitchen!' });
    }
};

const getById = async (req, res) => {
    try {
        const kitchenId = req.params.id;

        // Fetch the kitchen details by ID
        const getKitchenQuery = 'SELECT * FROM kitchens WHERE KitchenID = ?';
        const kitchenResult = await poolConnection.query(getKitchenQuery, [kitchenId]);

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