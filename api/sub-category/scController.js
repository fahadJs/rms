const poolConnection = require('../../config/database');

const create = async (req, res) => {
  try {
    const { subcategoryName, description, categoryId } = req.body;

    const query = 'INSERT INTO subcategories (SubCategoryName, Description, CategoryID) VALUES (?, ?, ?)';
    const result = await poolConnection.query(query, [subcategoryName, description, categoryId]);

    res.status(201).json({ message: 'Subcategory added successfully!' });
  } catch (error) {
    console.error(`Error executing query! Error: ${error}`);
    res.status(500).json('Error adding subcategory!');
  }
}

const getAll = async (req, res) => {
  try {
    const query = 'SELECT * FROM subcategories';
    const result = await poolConnection.query(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error executing query! Error: ${error}`);
    res.status(500).json({ error: 'Error fetching subcategories!' });
  }
}

module.exports = {
  create,
  getAll
}