const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM ingredients';
        const results = await poolConnection.query(selectQuery);

        res.status(200).json(results);
    } catch (error) {
        console.error(`Error fetching ingredients! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching ingredients!' });
    }
};

const create = async (req, res) => {
    try {
        const { IngredientName, PricePerGm } = req.body;

        // Check if the ingredient name already exists
        const checkDuplicateQuery = 'SELECT COUNT(*) AS count FROM ingredients WHERE IngredientName = ?';
        const result = await poolConnection.query(checkDuplicateQuery, [IngredientName]);
        const isDuplicate = result[0].count > 0;

        if (isDuplicate) {
            res.status(400).json({status: 400, message: 'Ingredient name already exists!' });
            return;
        }

        // If not a duplicate, insert the new ingredient
        const insertQuery = 'INSERT INTO ingredients (IngredientName, PricePerGm) VALUES (?, ?)';
        await poolConnection.query(insertQuery, [IngredientName, PricePerGm]);

        res.status(201).json({status: 201, message: 'Ingredient created successfully!' });
    } catch (error) {
        console.error(`Error creating ingredient! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error creating ingredient!' });
    }
};

const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { IngredientName, PricePerGm } = req.body;

        const updateQuery = 'UPDATE ingredients SET IngredientName = ?, PricePerGm = ? WHERE IngredientID = ?';
        await poolConnection.query(updateQuery, [IngredientName, PricePerGm, id]);

        res.status(200).json({status: 200, message: 'Ingredient updated successfully!' });
    } catch (error) {
        console.error(`Error updating ingredient! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating ingredient!' });
    }
};

const remove = async (req, res) => {
    try {
        const id = req.params.id;

        const deleteQuery = 'DELETE FROM ingredients WHERE IngredientID = ?';
        await poolConnection.query(deleteQuery, [id]);

        res.status(200).json({status: 200, message: 'Ingredient deleted successfully!' });
    } catch (error) {
        console.error(`Error deleting ingredient! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting ingredient!' });
    }
};

const getById = async (req, res) => {
    try {
        const id = req.params.id;

        const selectQuery = 'SELECT * FROM ingredients WHERE IngredientID = ?';
        const result = await poolConnection.query(selectQuery, [id]);

        if (result.length === 0) {
            res.status(404).json({status: 404, message: 'Ingredient not found!' });
        } else {
            res.status(200).json(result[0]);
        }
    } catch (error) {
        console.error(`Error fetching ingredient by ID! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching ingredient by ID!' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}