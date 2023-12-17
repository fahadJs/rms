const poolConnection = require('../../config/database');

// const getAll = async (req, res) => {
//     try {
//         let sql = 'SELECT * FROM categories LEFT JOIN menuitems ON categories.CategoryID = menuitems.CategoryID';
//         const result = await poolConnection.query(sql);

//         const caiData = result.reduce((acc, row) => {
//             if (!acc[row.CategoryID]) {
//                 acc[row.CategoryID] = {
//                     category_name: row.CategoryName,
//                     items: [],
//                 };
//             }
//             if (row.MenuItemID) {
//                 acc[row.CategoryID].items.push({
//                     item_name: row.Name,
//                     description: row.Description,
//                     price: row.Price,
//                 });
//             }
//             return acc;
//         }, {})
//         res.status(200).json(caiData);
//     } catch (error) {
//         console.error(`Error executing query! Error: ${error}`);
//         res.status(500).json('Error while Fetching items!');
//     }
// }

const getAll = async (req, res) => {
    try {
        let sql = `
            SELECT 
                categories.CategoryID AS category_id,
                categories.CategoryName AS category_name,
                subcategories.SubcategoryID AS subcategory_id,
                subcategories.SubcategoryName AS subcategory_name,
                menuitems.MenuItemID AS item_id,
                menuitems.Name AS item_name,
                menuitems.Description AS item_description,
                menuitems.Price AS item_price
            FROM 
                categories
                LEFT JOIN menuitem_categories ON categories.CategoryID = menuitem_categories.CategoryID
                LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
                LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
        `;
        
        const result = await poolConnection.query(sql);

        let categoriesData = result.reduce((acc, row) => {
            if (!acc[row.category_id]) {
                acc[row.category_id] = {
                    category_name: row.category_name,
                    subcategories: [],
                };
            }

            if (row.subcategory_id) {
                let subcategoryIndex = acc[row.category_id].subcategories.findIndex(
                    (subcategory) => subcategory.subcategory_id === row.subcategory_id
                );

                if (subcategoryIndex === -1) {
                    acc[row.category_id].subcategories.push({
                        subcategory_id: row.subcategory_id,
                        subcategory_name: row.subcategory_name,
                        items: [],
                    });
                    subcategoryIndex = acc[row.category_id].subcategories.length - 1;
                }

                acc[row.category_id].subcategories[subcategoryIndex].items.push({
                    item_id: row.item_id,
                    item_name: row.item_name,
                    item_description: row.item_description,
                    item_price: row.item_price,
                });
            }
            return acc;
        }, {});
        
        res.status(200).json(categoriesData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while fetching categories!');
    }
}

// const getAll = async (req, res) => {
//     try {
//         let sql = `
//             SELECT 
//                 categories.CategoryID AS category_id,
//                 categories.CategoryName AS category_name,
//                 JSON_ARRAYAGG(
//                     JSON_OBJECT(
//                         'subcategory_id', subcategories.SubcategoryID,
//                         'subcategory_name', subcategories.SubcategoryName,
//                         'menu', JSON_ARRAYAGG(
//                             JSON_OBJECT(
//                                 'item_id', menuitems.MenuItemID,
//                                 'item_name', menuitems.Name,
//                                 'item_description', menuitems.Description,
//                                 'item_price', menuitems.Price
//                             )
//                         )
//                     )
//                 ) AS subcategories
//             FROM 
//                 categories
//                 LEFT JOIN menuitem_categories ON categories.CategoryID = menuitem_categories.CategoryID
//                 LEFT JOIN subcategories ON menuitem_categories.SubcategoryID = subcategories.SubcategoryID
//                 LEFT JOIN menuitems ON menuitem_categories.MenuItemID = menuitems.MenuItemID
//             GROUP BY
//                 categories.CategoryID, categories.CategoryName
//         `;
        
//         const result = await poolConnection.query(sql);

//         const categoriesData = result.map(row => ({
//             category_id: row.category_id,
//             category_name: row.category_name,
//             subcategories: JSON.parse(row.subcategories),
//         }));
        
//         res.status(200).json(categoriesData);
//     } catch (error) {
//         console.error(`Error executing query! Error: ${error}`);
//         res.status(500).json('Error while fetching categories!');
//     }
// }

module.exports = {
    getAll
}