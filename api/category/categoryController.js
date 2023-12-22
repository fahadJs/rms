const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        const { categoryName, description } = req.body;

        const query = 'INSERT INTO categories (CategoryName, Description) VALUES (?, ?)';
        const result = await poolConnection.query(query, [categoryName, description]);

        res.status(201).json({ message: 'Category added successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error adding category!');
    }
}

const getAll = async (req, res) => {
    try {
        const query = 'SELECT * FROM categories';
        const result = await poolConnection.query(query);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching categories!' });
    }
}

module.exports = {
    create,
    getAll
}