const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    const {restaurant_id} = req.params;
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
                AND menuitems.restaurant_id = ?
        ) AS menu
    FROM 
        categories
        LEFT JOIN menuitem_categories ON categories.CategoryID = menuitem_categories.CategoryID
        LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
`;

        const result = await poolConnection.query(sql, [restaurant_id]);

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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

// const getAll2 = async (req, res) => {
//     try {
//         const { restaurant_id } = req.params;

//         let sql = `
//             SELECT 
//                 subcategories.SubcategoryID AS subcategory_id,
//                 subcategories.SubcategoryName AS subcategory_name,
//                 JSON_ARRAYAGG(
//                     JSON_OBJECT(
//                         'item_id', menuitems.MenuItemID,
//                         'item_name', menuitems.Name,
//                         'item_description', menuitems.Description,
//                         'item_price', menuitems.Price,
//                         'kitchen_id', menuitem_categories.KitchenID,
//                         'extras', extrasData.extras
//                     )
//                 ) AS items
//             FROM 
//                 menuitem_categories
//                 LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
//                 LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
//                 LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID
//                 LEFT JOIN (
//                     SELECT
//                         menu_extras.MenuItemID,
//                         JSON_ARRAYAGG(
//                             JSON_OBJECT(
//                                 'extras_id', menu_extras.extras_id,
//                                 'extras_name', menu_extras.extras_name,
//                                 'extras_price', menu_extras.extras_price
//                             )
//                         ) AS extras
//                     FROM
//                         menu_extras
//                     GROUP BY
//                         menu_extras.MenuItemID
//                 ) AS extrasData ON menuitems.MenuItemID = extrasData.MenuItemID
//             WHERE 
//                 kitchens.restaurant_id = ?
//             GROUP BY
//                 subcategory_id, subcategory_name, menuitems.MenuItemID;
//         `;

//         const result = await poolConnection.query(sql, [restaurant_id]);

//         const subcategoriesData = result.map(row => ({
//             subcategory_id: row.subcategory_id,
//             subcategory_name: row.subcategory_name,
//             items: JSON.parse(row.items),
//         }));

//         res.status(200).json(subcategoriesData);
//     } catch (error) {
//         console.error(`Error executing query! Error: ${error}`);
//         res.status(500).json({ status: 500, message: 'Error while fetching subcategories and items!' });
//     }


// }

const getAll2 = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        let sql = `
            SELECT 
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                menuitems.MenuItemID,
                menuitems.Name AS item_name,
                menuitems.Description AS item_description,
                menuitems.Price AS item_price,
                menuitem_categories.KitchenID AS kitchen_id,
                menu_extras.extras_id,
                menu_extras.extras_name,
                menu_extras.extras_price
            FROM 
                menuitem_categories
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
                LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID
                LEFT JOIN menu_extras ON menuitems.MenuItemID = menu_extras.MenuItemID
            WHERE 
                kitchens.restaurant_id = ?
            ORDER BY
                subcategories.SubcategoryID, menuitems.MenuItemID;
        `;

        const result = await poolConnection.query(sql, [restaurant_id]);

        const groupedItems = {};

        result.forEach(row => {
            const key = `${row.subcategory_id}_${row.subcategory_name}`;
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    subcategory_id: row.subcategory_id,
                    subcategory_name: row.subcategory_name,
                    items: [],
                };
            }

            const itemKey = `${row.MenuItemID}_${row.item_name}`;
            const existingItem = groupedItems[key].items.find(item => item.key === itemKey);

            if (!existingItem) {
                const item = {
                    key: itemKey,
                    item_id: row.MenuItemID,
                    item_name: row.item_name,
                    item_description: row.item_description,
                    item_price: row.item_price,
                    kitchen_id: row.kitchen_id,
                    extras: [],
                };

                if (row.extras_id) {
                    item.extras.push({
                        extras_id: row.extras_id,
                        extras_name: row.extras_name,
                        extras_price: row.extras_price,
                    });
                }

                groupedItems[key].items.push(item);
            } else {
                if (row.extras_id) {
                    existingItem.extras.push({
                        extras_id: row.extras_id,
                        extras_name: row.extras_name,
                        extras_price: row.extras_price,
                    });
                }
            }
        });

        Object.values(groupedItems).forEach(subcategory => {
            subcategory.items.sort((a, b) => a.item_id - b.item_id);
            subcategory.items.forEach(item => {
                item.extras.sort((a, b) => a.extras_id - b.extras_id);
            });
        });

        const subcategoriesData = Object.values(groupedItems);

        res.status(200).json(subcategoriesData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getAll3 = async (req, res) => {
    // try {
    //     let sql = `
    //         SELECT 
    //             subcategories.SubcategoryID AS subcategory_id,
    //             subcategories.SubcategoryName AS subcategory_name,
    //             menuitems.MenuItemID AS item_id,
    //             menuitems.Name AS item_name,
    //             menuitems.Description AS item_description,
    //             menuitems.Price AS item_price,
    //             menuitem_categories.KitchenID AS kitchen_id
    //         FROM 
    //             menuitem_categories
    //             LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
    //             LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
    //     `;

    //     const result = await poolConnection.query(sql);

    //     const subcategoriesData = result.map(row => ({
    //         subcategory_id: row.subcategory_id,
    //         subcategory_name: row.subcategory_name,
    //         item_id: row.item_id,
    //         item_name: row.item_name,
    //         item_description: row.item_description,
    //         item_price: row.item_price,
    //         kitchen_id: row.kitchen_id,
    //     }));

    //     res.status(200).json(subcategoriesData);
    // } catch (error) {
    //     console.error(`Error executing query! Error: ${error}`);
    //     res.status(500).json('Error while fetching subcategories and items!');
    // }

    try {
        let sql = `
            SELECT 
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                menuitems.MenuItemID AS item_id,
                menuitems.Name AS item_name,
                menuitems.Description AS item_description,
                menuitems.Price AS item_price,
                menuitem_categories.KitchenID AS kitchen_id
            FROM 
                menuitem_categories
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
        `;

        const result = await poolConnection.query(sql);

        const subcategoriesData = result.map(row => ({
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            items: [{
                item_id: row.item_id,
                item_name: row.item_name,
                item_description: row.item_description,
                item_price: row.item_price,
                kitchen_id: row.kitchen_id,
            }]
        }));

        res.status(200).json(subcategoriesData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getAllSimpleV3 = async (req, res) => {
    try {
        const subcategoryId = req.params.id;

        let sql = `
            SELECT 
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                menuitems.MenuItemID AS item_id,
                menuitems.Name AS item_name,
                menuitems.Description AS item_description,
                menuitems.Price AS item_price,
                menuitem_categories.KitchenID AS kitchen_id
            FROM 
                menuitem_categories
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
            WHERE 
                subcategories.SubcategoryID = ?
        `;

        const result = await poolConnection.query(sql, [subcategoryId]);

        if (result.length === 0) {
            res.status(404).json({ status: 404, message: 'Subcategory not found!' });
            return;
        }

        const subcategoryData = result.map(row => ({
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            item_id: row.item_id,
            item_name: row.item_name,
            item_description: row.item_description,
            item_price: row.item_price,
            kitchen_id: row.kitchen_id,
        }));

        res.status(200).json(subcategoryData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getAll2ById = async (req, res) => {
    try {
        const { subcategoryId, restaurant_id } = req.params;

        let sql = `
            SELECT 
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'item_id', menuitems.MenuItemID,
                        'item_name', menuitems.Name,
                        'item_description', menuitems.Description,
                        'item_price', menuitems.Price,
                        'kitchen_id', menuitem_categories.KitchenID
                    )
                ) AS items
            FROM 
                menuitem_categories
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
                LEFT JOIN kitchens ON menuitem_categories.KitchenID = kitchens.KitchenID
            WHERE 
                subcategories.SubcategoryID = ? AND
                kitchens.restaurant_id = ?
            GROUP BY
                subcategory_id, subcategory_name
        `;

        const result = await poolConnection.query(sql, [subcategoryId, restaurant_id]);

        if (result.length === 0) {
            res.status(404).json({ status: 404, message: 'Subcategory not found!' });
            return;
        }

        const subcategoryData = result.map(row => ({
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            items: JSON.parse(row.items),
        }))[0];

        res.status(200).json(subcategoryData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}


module.exports = {
    getAll,
    getAll2,
    getAll3,
    getAll2ById,
    getAllSimpleV3
}