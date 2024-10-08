const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        let query = `SELECT * FROM menuitems WHERE restaurant_id = ? AND visible = 'true'`;
        const result = await poolConnection.query(query, [restaurant_id]);

        res.status(200).json(result);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getForRecipeItems = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        // Select menu items that do not exist in recipe_items
        let query = `
            SELECT *
            FROM menuitems
            WHERE restaurant_id = ? AND visible = 'true' AND MenuItemID NOT IN (
                SELECT DISTINCT MenuItemID
                FROM recipe_items
            )`;
    
        const result = await poolConnection.query(query, [restaurant_id]);
    
        res.status(200).json(result);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const create = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const { name, description, price, categoryId, kitchenId, subCategoryId } = req.body;

        await poolConnection.query('START TRANSACTION');

        const insertMenuItemQuery = 'INSERT INTO menuitems (Name, Description, Price, CostPrice, restaurant_id) VALUES (?, ?, ?, 0, ?)';
        const insertMenuItemValues = [name, description, price, restaurant_id];
        const menuItemResult = await poolConnection.query(insertMenuItemQuery, insertMenuItemValues);

        const menuItemId = menuItemResult.insertId;

        const insertMenuItemCategoryQuery = 'INSERT INTO menuitem_categories (MenuItemID, CategoryID, SubCategoryID, KitchenID) VALUES (?, ?, ?, ?)';
        const insertMenuItemCategoryValues = [menuItemId, categoryId, subCategoryId, kitchenId];
        await poolConnection.query(insertMenuItemCategoryQuery, insertMenuItemCategoryValues);

        await poolConnection.query('COMMIT');

        res.status(201).json({status: 201, message: 'Menu item added successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');

        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
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

        res.status(200).json({status: 200, message: 'Menu item updated successfully!' });
    } catch (error) {

        await poolConnection.query('ROLLBACK');

        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const itemId = req.params.id;
        let sql = `SELECT * FROM menuitems WHERE MenuItemID = ? AND visible = 'true'`;
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
            res.status(404).json({status: 404, message: 'Item not found.'});
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        let sql = 'DELETE FROM menuitems WHERE MenuItemID = ?';
        const result = await poolConnection.query(sql, [itemId]);

        if (result.affectedRows > 0) {
            res.status(200).json({status: 200, message: 'Record Deleted Successfully!'});
        } else {
            res.status(404).json({status: 404, message: 'Item not found or already deleted.'});
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};



module.exports = {
    getAll,
    getForRecipeItems,
    create,
    update,
    getById,
    deleteItem
}