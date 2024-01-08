const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const { categoryName, description } = req.body;

        const query = 'INSERT INTO categories (CategoryName, Description, restaurant_id) VALUES (?, ?, ?)';
        const result = await poolConnection.query(query, [categoryName, description, restaurant_id]);

        res.status(201).json({status: 201, message: 'Category added successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error adding category!'});
    }
}

const getAll = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const query = 'SELECT * FROM categories WHERE restaurant_id = ?';
        const result = await poolConnection.query(query, restaurant_id);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching categories!' });
    }
};

const getById = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const query = 'SELECT * FROM categories WHERE CategoryID = ?';
        const result = await poolConnection.query(query, [categoryId]);

        if (result.length === 0) {
            res.status(404).json({status: 404, message: 'Category not found!' });
        } else {
            res.status(200).json(result[0]);
        }
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching category!' });
    }
};

const update = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { categoryName } = req.body;
        const query = 'UPDATE categories SET CategoryName = ? WHERE CategoryID = ?';
        await poolConnection.query(query, [categoryName, categoryId]);
        res.status(200).json({status: 200, message: 'Category updated successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating category!' });
    }
};

const del = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Check if the category exists
        const checkCategoryQuery = 'SELECT * FROM categories WHERE CategoryID = ?';
        const checkResult = await poolConnection.query(checkCategoryQuery, [categoryId]);

        if (checkResult.length === 0) {
            return res.status(404).json({status: 404, message: 'Category not found!' });
        }

        // Delete the category
        const deleteCategoryQuery = 'DELETE FROM categories WHERE CategoryID = ?';
        await poolConnection.query(deleteCategoryQuery, [categoryId]);

        res.status(200).json({status: 200, message: 'Category deleted successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting category!' });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    del
}