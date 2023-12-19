const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        let sql = `
            SELECT 
                categories.CategoryID AS category_id,
                categories.CategoryName AS category_name,
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'item_id', menuitems.MenuItemID,
                            'item_name', menuitems.Name,
                            'item_description', menuitems.Description,
                            'item_price', menuitems.Price
                        )
                    )
                    FROM menuitem_categories
                    JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
                    WHERE menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                ) AS menu
            FROM 
                categories
                LEFT JOIN menuitem_categories ON categories.CategoryID = menuitem_categories.CategoryID
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
        `;

        const result = await poolConnection.query(sql);

        const categoriesData = result.map(row => ({
            category_id: row.category_id,
            category_name: row.category_name,
            subcategories: [
                {
                    subcategory_id: row.subcategory_id,
                    subcategory_name: row.subcategory_name,
                    menu: JSON.parse(row.menu),
                }
            ],
        }));

        res.status(200).json(categoriesData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching categories!');
    }
}

const getAll2 = async (req, res) => {
    try {
        let sql = `
            SELECT 
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'item_id', menuitems.MenuItemID,
                        'item_name', menuitems.Name,
                        'item_description', menuitems.Description,
                        'item_price', menuitems.Price
                    )
                ) AS items
            FROM 
                menuitem_categories
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
            GROUP BY
                subcategory_id, subcategory_name
        `;

        const result = await poolConnection.query(sql);

        const subcategoriesData = result.map(row => ({
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            items: JSON.parse(row.items),
        }));

        res.status(200).json(subcategoriesData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching subcategories and items!');
    }
}


module.exports = {
    getAll,
    getAll2
}