const poolConnection = require('../../config/database');


const getAll = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        let sql = `
            SELECT 
                menuitems.MenuItemID,
                menuitems.Name,
                menuitems.Description,
                menuitems.Price,
                categories.CategoryName,
                categories.CategoryID,
                inventory.on_hand,
                kitchens.Name AS kitchenName,
                kitchens.KitchenID AS kitchenid,
                kitchens.restaurant_id AS restaurantid
            FROM 
                menuitems
                JOIN menuitem_categories ON menuitems.MenuItemID = menuitem_categories.MenuItemID
                JOIN categories ON menuitem_categories.CategoryID = categories.CategoryID
                LEFT JOIN inventory ON menuitems.MenuItemID = inventory.MenuItemID
                LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID
            WHERE 
                kitchens.restaurant_id = ?;  -- Filter by restaurant_id
        `;
        
        const result = await poolConnection.query(sql, [restaurant_id]);

        const menuData = result.map(results => ({
            item_id: results.MenuItemID,
            item_name: results.Name,
            item_description: results.Description,
            item_price: results.Price,
            category_id: results.CategoryID,
            category_name: results.CategoryName,
            item_quantity: results.on_hand,
            kitchen_name: results.kitchenName,
            kitchen_id: results.kitchenid,
            restaurant_id: results.restaurantid
        }));

        res.status(200).json(menuData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error while fetching items!'});
    }
}

module.exports = {
    getAll
}