const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        const { subcategoryName, categoryId } = req.body;
    
        const query = 'INSERT INTO subcategories (SubCategoryName, Description CategoryID) VALUES (?, ?)';
        const result = await poolConnection.query(query, [subcategoryName, categoryId]);
    
        res.status(201).json({ message: 'Subcategory added successfully!' });
      } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error adding subcategory!');
      }
}

module.exports = {
    create
}