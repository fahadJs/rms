const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT categories.CategoryID, categories.CategoryName, menuitems.MenuItemID, menuitems.Name as itemName, menuitems.Description, menuitems.Price, inventory.Quantity, kitchens.Name FROM categories LEFT JOIN menuitems ON categories.CategoryID = menuitems.CategoryID LEFT JOIN menuitem_categories ON menuitems.MenuItemID = menuitem_categories.MenuItemID LEFT JOIN inventory ON menuitems.MenuItemID = inventory.MenuItemID LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID';
        
        const result = await poolConnection.query(sql);

        const caikData = result.reduce((acc, row) => {
            if (!acc[row.CategoryName]) {
                acc[row.CategoryName] = {
                    category_id: row.CategoryID,
                    category_name: row.CategoryName,
                    items: [],
                };
            }
            if (row.MenuItemID) {
                acc[row.CategoryName].items.push({
                    item_name: row.itemName,
                    description: row.Description,
                    price: row.Price,
                    quantity: row.Quantity,
                    kitchen: row.Name
                });
            }
            return acc;
        }, {})
        res.status(200).json(caikData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching items!');
    }
}

module.exports = {
    getAll
}