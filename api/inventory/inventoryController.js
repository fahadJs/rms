const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        let sql = `
            SELECT 
                inventory.InventoryID,
                menuitems.MenuItemID,
                menuitems.Name AS item_name,
                categories.CategoryID,
                categories.CategoryName AS category_name,
                inventory.Unit,
                inventory.available,
                inventory.reserved,
                inventory.on_hand
            FROM 
                inventory
                JOIN menuitems ON inventory.MenuItemID = menuitems.MenuItemID
                LEFT JOIN categories ON inventory.CategoryID = categories.CategoryID
            WHERE
                inventory.restaurant_id = ?
        `;

        const result = await poolConnection.query(sql, [restaurant_id]);

        const inventoryData = result.map(row => ({
            inventory_id: row.InventoryID,
            item_name: row.item_name,
            menuitem_id: row.MenuItemID,
            category_name: row.category_name,
            category_id: row.CategoryID,
            unit: row.Unit,
            available: row.available,
            reserved: row.reserved,
            on_hand: row.on_hand,
        }));

        res.status(200).json(inventoryData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const update = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const {restaurant_id} = req.params;
        const { menuitem_id, on_hand } = req.body;

        const existingInventoryQuery = 'SELECT * FROM inventory WHERE MenuItemID = ? AND restaurant_id = ? FOR UPDATE';
        const existingInventory = await poolConnection.query(existingInventoryQuery, [menuitem_id, restaurant_id]);

        if (existingInventory.length > 0) {
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = ? WHERE MenuItemID = ? AND restaurant_id = ?';
            await poolConnection.query(updateInventoryQuery, [on_hand, menuitem_id, restaurant_id]);
        }

        await poolConnection.query('COMMIT');
        res.status(200).json({status: 200, message: 'Inventory updated successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const {restaurant_id} = req.params;
        const { menuitem_id, unit, on_hand } = req.body;

        const existingInventoryQuery = 'SELECT * FROM inventory WHERE MenuItemID = ? AND restaurant_id = ? FOR UPDATE';
        const existingInventory = await poolConnection.query(existingInventoryQuery, [menuitem_id, restaurant_id]);

        if (existingInventory.length > 0) {
            await poolConnection.query('ROLLBACK');
            return res.status(400).json({status: 400, message: 'Inventory already exists for the specified menu item and category!' });
        }

        const getCategoryIdQuery = `SELECT CategoryID FROM menuitem_categories WHERE MenuItemID = ?`;
        const getCategoryId = await poolConnection.query(getCategoryIdQuery, [menuitem_id]);

        const category_id = getCategoryId[0].CategoryID;

        const insertInventoryQuery = 'INSERT INTO inventory (MenuItemID, Unit, CategoryID, available, reserved, on_hand, restaurant_id) VALUES (?, ?, ?, 0, 0, ?, ?)';
        await poolConnection.query(insertInventoryQuery, [menuitem_id, unit, category_id, on_hand, restaurant_id]);

        await poolConnection.query('COMMIT');
        res.status(201).json({status: 201, message: 'Inventory created successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const updateOnHand = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const {restaurant_id} = req.params;
        const menuitem_id = req.params.mid;
        const on_hand = req.params.ohid

        const existingInventoryQuery = 'SELECT * FROM inventory WHERE MenuItemID = ? AND restaurant_id = ? FOR UPDATE';
        const existingInventory = await poolConnection.query(existingInventoryQuery, [menuitem_id, restaurant_id]);

        if (existingInventory.length > 0) {
            const updateInventoryQuery = 'UPDATE inventory SET on_hand = ? WHERE MenuItemID = ? AND restaurant_id = ?';
            await poolConnection.query(updateInventoryQuery, [on_hand, menuitem_id, restaurant_id]);
        }

        await poolConnection.query('COMMIT');
        res.status(200).json({status: 200, message: 'Inventory updated successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getAll,
    update,
    create,
    updateOnHand
};