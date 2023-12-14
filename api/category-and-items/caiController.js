const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        let sql = 'SELECT * FROM categories LEFT JOIN menuitems ON categories.CategoryID = menuitems.CategoryID';
        const result = await poolConnection.query(sql);

        const caiData = result.reduce((acc, row) => {
            if (!acc[row.CategoryID]) {
                acc[row.CategoryID] = {
                    category_name: row.CategoryName,
                    items: [],
                };
            }
            if (row.MenuItemID) {
                acc[row.CategoryID].items.push({
                    item_name: row.Name,
                    description: row.Description,
                    price: row.Price,
                });
            }
            return acc;
        }, {})
        res.status(200).json(caiData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching items!');
    }
}

module.exports = {
    getAll
}