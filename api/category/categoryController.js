const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const { categoryName, description } = req.body;

        const query = 'INSERT INTO categories (CategoryName, Description, restaurant_id) VALUES (?, ?, ?)';
        const result = await poolConnection.query(query, [categoryName, description, restaurant_id]);

        res.status(201).json({status: 201, message: 'Category added successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getAll = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const query = `SELECT * FROM categories WHERE restaurant_id = ? AND visible = 'true'`;
        const result = await poolConnection.query(query, restaurant_id);
        res.status(200).json(result);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const del = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const checkCategoryQuery = 'SELECT * FROM categories WHERE CategoryID = ?';
        const checkResult = await poolConnection.query(checkCategoryQuery, [categoryId]);

        if (checkResult.length === 0) {
            return res.status(404).json({status: 404, message: 'Category not found!' });
        }

        const deleteCategoryQuery = 'DELETE FROM categories WHERE CategoryID = ?';
        await poolConnection.query(deleteCategoryQuery, [categoryId]);

        res.status(200).json({status: 200, message: 'Category deleted successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    del
}