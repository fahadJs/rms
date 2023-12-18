const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
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
        `;

        const result = await poolConnection.query(sql);

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
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching inventory!');
    }
}

const update = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { menuitem_id, available, reserved, on_hand } = req.body;

        const existingInventoryQuery = 'SELECT * FROM inventory WHERE MenuItemID = ? FOR UPDATE';
        const existingInventory = await poolConnection.query(existingInventoryQuery, [menuitem_id]);

        if (existingInventory.length > 0) {
            const updateInventoryQuery = 'UPDATE inventory SET available = ?, reserved = ?, on_hand = ? WHERE MenuItemID = ?';
            await poolConnection.query(updateInventoryQuery, [available, reserved, on_hand, menuitem_id]);
        }

        await poolConnection.query('COMMIT');
        res.status(200).json({ message: 'Inventory updated successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error updating inventory! Error: ${error}`);
        res.status(500).json({ error: 'Error updating inventory!' });
    }
};

const create = async (req, res) => {
    try {
      await poolConnection.query('START TRANSACTION');
  
      const { menuitem_id, category_id, unit, available, reserved } = req.body;
  
      const existingInventoryQuery = 'SELECT * FROM inventory WHERE MenuItemID = ? AND CategoryID = ? FOR UPDATE';
      const existingInventory = await poolConnection.query(existingInventoryQuery, [menuitem_id, category_id]);
  
      if (existingInventory.length > 0) {
        await poolConnection.query('ROLLBACK');
        return res.status(400).json({ error: 'Inventory already exists for the specified menu item and category!' });
      }
  
      const insertInventoryQuery = 'INSERT INTO inventory (MenuItemID, CategoryID, Unit, available, reserved, on_hand) VALUES (?, ?, ?, ?, ?, ?)';
      const on_hand = available + reserved;
      await poolConnection.query(insertInventoryQuery, [menuitem_id, category_id, unit, available, reserved, on_hand]);
  
      await poolConnection.query('COMMIT');
      res.status(201).json({ message: 'Inventory created successfully!' });
    } catch (error) {
      await poolConnection.query('ROLLBACK');
      console.error(`Error creating inventory! Error: ${error}`);
      res.status(500).json({ error: 'Error creating inventory!' });
    }
  };

module.exports = {
    getAll,
    update,
    create
};