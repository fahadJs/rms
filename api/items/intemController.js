const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT *, menuitems.Description as des FROM menuitems JOIN categories ON menuitems.CategoryID = categories.CategoryID';
        const result = await poolConnection.query(sql);
        const menuData = result.map(results => ({
            id: results.MenuItemID,
            name: results.Name,
            description: results.des,
            price: results.Price,
            category: results.CategoryName
        }))
        res.status(200).json(menuData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching items!');
    }
};

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
};

const update = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, description, price, categoryId } = req.body;

        let sql = 'UPDATE menuitems SET Name=?, Description=?, Price=?, CategoryID=? WHERE MenuItemID=?';
        const result = await poolConnection.query(sql, [name, description, price, categoryId, itemId]);

        if (result.affectedRows > 0) {
            res.status(200).json('Record Updated Successfully!');
        } else {
            res.status(404).json('Record not found or no changes made.');
        }
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while updating item!');
    }
};

const getById = async (req, res) => {
    try {
        const itemId = req.params.id;
        let sql = 'SELECT * FROM menuitems WHERE MenuItemID = ?';
        const result = await poolConnection.query(sql, [itemId]);

        if (result.length > 0) {
            const itemData = {
                id: result[0].MenuItemID,
                name: result[0].Name,
                description: result[0].Description,
                price: result[0].Price,
                category: result[0].CategoryID,
            };
            res.status(200).json(itemData);
        } else {
            res.status(404).json('Item not found.');
        }
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching item!');
    }
};

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        let sql = 'DELETE FROM menuitems WHERE MenuItemID = ?';
        const result = await poolConnection.query(sql, [itemId]);

        if (result.affectedRows > 0) {
            res.status(200).json('Record Deleted Successfully!');
        } else {
            res.status(404).json('Item not found or already deleted.');
        }
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while deleting item!');
    }
};



module.exports = {
    getAll,
    create,
    update,
    getById,
    deleteItem
}