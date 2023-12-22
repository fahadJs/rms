const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT * FROM menuitems';
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
        const { name, description, price, categoryId, kitchenId, subCategoryId } = req.body;

        await poolConnection.query('START TRANSACTION');

        const insertMenuItemQuery = 'INSERT INTO menuitems (Name, Description, Price) VALUES (?, ?, ?)';
        const insertMenuItemValues = [name, description, price];
        const menuItemResult = await poolConnection.query(insertMenuItemQuery, insertMenuItemValues);

        const menuItemId = menuItemResult.insertId;

        const insertMenuItemCategoryQuery = 'INSERT INTO menuitem_categories (MenuItemID, CategoryID, SubCategoryID, KitchenID) VALUES (?, ?, ?)';
        const insertMenuItemCategoryValues = [menuItemId, categoryId, subCategoryId, kitchenId];
        await poolConnection.query(insertMenuItemCategoryQuery, insertMenuItemCategoryValues);

        await poolConnection.query('COMMIT');

        res.status(201).json({ message: 'Menu item added successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error adding menu item!' });
    }
};

const update = async (req, res) => {
    try {
        const menuItemId = req.params.id;
        const { name, description, price, categoryId, subCategoryId, kitchenId } = req.body;

        await poolConnection.query('START TRANSACTION');

        const updateMenuItemQuery = 'UPDATE menuitems SET Name = ?, Description = ?, Price = ? WHERE MenuItemID = ?';
        const updateMenuItemValues = [name, description, price, menuItemId];
        await poolConnection.query(updateMenuItemQuery, updateMenuItemValues);

        const updateMenuItemCategoryQuery = 'UPDATE menuitem_categories SET CategoryID = ?, SubCategoryID = ?, KitchenID = ? WHERE MenuItemID = ?';
        const updateMenuItemCategoryValues = [categoryId, subCategoryId, kitchenId, menuItemId];
        await poolConnection.query(updateMenuItemCategoryQuery, updateMenuItemCategoryValues);

        await poolConnection.query('COMMIT');

        res.status(200).json({ message: 'Menu item updated successfully!' });
    } catch (error) {

        await poolConnection.query('ROLLBACK');

        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error updating menu item!' });
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