const poolConnection = require('../../config/database');

const create = async (req, res) => {
  try {
    const {restaurant_id} = req.params;
    const { subcategoryName, description } = req.body;

    const query = 'INSERT INTO subcategories (SubCategoryName, Description, restaurant_id) VALUES (?, ?, ?)';
    const result = await poolConnection.query(query, [subcategoryName, description, restaurant_id]);

    res.status(201).json({status: 201, message: 'Subcategory added successfully!' });
  } catch (error) {
    console.error(`Error executing query! Error: ${error}`);
    res.status(500).json({status: 500, message: 'Error adding subcategory!'});
  }
}

const getAll = async (req, res) => {
  try {
    const {restaurant_id} = req.params;
    const query = `SELECT * FROM subcategories WHERE restaurant_id = ? AND visible = 'true'`;
    const result = await poolConnection.query(query, [restaurant_id]);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error executing query! Error: ${error}`);
    res.status(500).json({status: 500, message: 'Error fetching subcategories!' });
  }
}

const update = async (req, res) => {
  try {
    const subcategoryId = req.params.id
      const { subcategoryName } = req.body;
      const query = 'UPDATE subcategories SET SubcategoryName = ? WHERE SubcategoryID = ?';
      await poolConnection.query(query, [subcategoryName, subcategoryId]);
      res.status(200).json({status: 200, message: 'Subcategory updated successfully!' });
  } catch (error) {
      console.error(`Error executing query! Error: ${error}`);
      res.status(500).json({status: 500, error: 'Error updating subcategory!' });
  }
};

const getById = async (req, res) => {
  try {
      const subcategoryId = req.params.id;
      const query = 'SELECT * FROM subcategories WHERE SubcategoryID = ?';
      const result = await poolConnection.query(query, [subcategoryId]);

      if (result.length === 0) {
          res.status(404).json({status: 404, message: 'Subcategory not found!' });
      } else {
          res.status(200).json(result[0]);
      }
  } catch (error) {
      console.error(`Error executing query! Error: ${error}`);
      res.status(500).json({status: 500, message: 'Error fetching subcategory!' });
  }
};

const del = async (req, res) => {
  try {
      const subcategoryId = req.params.id;
      
      const checkSubcategoryQuery = 'SELECT * FROM subcategories WHERE SubcategoryID = ?';
      const checkResult = await poolConnection.query(checkSubcategoryQuery, [subcategoryId]);

      if (checkResult.length === 0) {
          return res.status(404).json({status: 404, message: 'Subcategory not found!' });
      }

      const deleteSubcategoryQuery = 'DELETE FROM subcategories WHERE SubcategoryID = ?';
      await poolConnection.query(deleteSubcategoryQuery, [subcategoryId]);

      res.status(200).json({status: 200, message: 'Subcategory deleted successfully!' });
  } catch (error) {
      console.error(`Error executing query! Error: ${error}`);
      res.status(500).json({status: 500, message: 'Error deleting subcategory!' });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  del
}