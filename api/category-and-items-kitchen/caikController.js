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
                subcategories.SubCategoryName,
                subcategories.SubCategoryID,
                inventory.on_hand,
                kitchens.Name AS kitchenName,
                kitchens.KitchenID AS kitchenid,
                kitchens.restaurant_id AS restaurantid,
                menuextras.extras_id,
                menuextras.extras_name,
                menuextras.extras_price
            FROM 
                menuitems
                JOIN menuitem_categories ON menuitems.MenuItemID = menuitem_categories.MenuItemID
                JOIN subcategories ON menuitem_categories.SubCategoryID = subcategories.SubCategoryID
                LEFT JOIN inventory ON menuitems.MenuItemID = inventory.MenuItemID
                LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID
                LEFT JOIN menu_extras AS menuextras ON menuitems.MenuItemID = menuextras.MenuItemID
            WHERE 
                kitchens.restaurant_id = ?;
        `;
        
        const result = await poolConnection.query(sql, [restaurant_id]);
    
        const menuData = result.reduce((acc, results) => {
            const existingItem = acc.find(item => item.item_id === results.MenuItemID);
    
            if (!existingItem) {
                const newItem = {
                    item_id: results.MenuItemID,
                    item_name: results.Name,
                    item_description: results.Description,
                    item_price: results.Price,
                    category_id: results.SubCategoryID,
                    category_name: results.SubCategoryName,
                    item_quantity: results.on_hand,
                    kitchen_name: results.kitchenName,
                    kitchen_id: results.kitchenid,
                    restaurant_id: results.restaurantid,
                    extras: []
                };
    
                if (results.extras_id) {
                    newItem.extras.push({
                        extras_id: results.extras_id,
                        extras_name: results.extras_name,
                        extras_price: results.extras_price
                    });
                }
    
                acc.push(newItem);
            } else {
                if (results.extras_id) {
                    existingItem.extras.push({
                        extras_id: results.extras_id,
                        extras_name: results.extras_name,
                        extras_price: results.extras_price
                    });
                }
            }
    
            return acc;
        }, []);
    
        res.status(200).json(menuData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
    
}

module.exports = {
    getAll
}