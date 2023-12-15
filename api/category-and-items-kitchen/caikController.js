const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT menuitems.MenuItemID, menuitems.Name, menuitems.Description, menuitems.Price, categories.CategoryName, categories.CategoryID, inventory.Quantity, kitchens.Name AS kitchenName FROM menuitems JOIN categories ON menuitems.CategoryID = categories.CategoryID LEFT JOIN menuitem_categories ON menuitems.MenuItemID = menuitem_categories.MenuItemID LEFT JOIN inventory ON menuitems.MenuItemID = inventory.MenuItemID LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID';
        
        const result = await poolConnection.query(sql);

        const menuData = result.map(results => ({
            item_id: results.MenuItemID,
            item_name: results.Name,
            item_description: results.Description,
            item_price: results.Price,
            category_id: results.CategoryID,
            category_name: results.CategoryName,
            item_quantity: results.Quantity,
            kitchen_name: results.kitchenName
        }))
        res.status(200).json(menuData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching items!');
    }
}

module.exports = {
    getAll
}