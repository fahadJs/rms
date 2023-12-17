const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        let sql = `
            SELECT 
                inventory.InventoryID,
                menuitems.Name AS item_name,
                categories.CategoryName AS category_name,
                inventory.Unit,
                inventory.available,
                inventory.reserved,
                inventory.on_hand
            FROM 
                inventory
                JOIN menuitems ON inventory.MenuItemID = menuitems.MenuItemID
                LEFT JOIN categories ON inventory.CategoryID = categories.CategoryID
        `;
        
        const result = await poolConnection.query(sql);

        const inventoryData = result.map(row => ({
            inventory_id: row.InventoryID,
            item_name: row.item_name,
            category_name: row.category_name,
            unit: row.Unit,
            available: row.available,
            reserved: row.reserved,
            on_hand: row.on_hand,
        }));

        res.status(200).json(inventoryData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching inventory!');
    }
}

module.exports = {
    getAll
};