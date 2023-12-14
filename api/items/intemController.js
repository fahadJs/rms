const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT * FROM menuitems JOIN categories ON menuitems.CategoryID = categories.CategoryID';
        const result = await poolConnection.query(sql);
        const menuData = result.map(results => ({
            id: results.MenuItemID,
            name: results.Name,
            description: results.Description,
            price: results.Price,
            category: results.CategoryName
        }))
        res.status(200).json(menuData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching items!');
    }
}

const create = async (req, res) => {
    try {
        let values = { name: req.body.name, description: req.body.description, price: req.body.price, categoryId: req.body.categoryId };
        let sql = 'INSERT INTO menuitems SET ?';
        const result = await poolConnection.query(sql, values);
        res.status(200).json('New Record Inserted Successfully!');
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while adding items!');
    }
}

module.exports = {
    getAll,
    create
}