const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const rows = await poolConnection.query('SELECT * FROM recipe_items WHERE restaurant_id = ?',[restaurant_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getAllWithIngredients = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const query = `
            SELECT
                menuitems.MenuItemID,
                menuitems.Name,
                menuitems.CostPrice,
                JSON_ARRAYAGG(JSON_OBJECT('IngredientName', ingredients.IngredientName, 'PricePerGm', ingredients.PricePerGm)) AS ingredients
            FROM
                menuitems
            INNER JOIN
                recipe_items ON menuitems.MenuItemID = recipe_items.MenuItemID
            INNER JOIN
                ingredients ON recipe_items.IngredientID = ingredients.IngredientID
            WHERE
                menuitems.restaurant_id = ?
            GROUP BY
                menuitems.MenuItemID
        `;
    
        const rows = await poolConnection.query(query, [restaurant_id]);
    
        // Parse the ingredients column to ensure proper JSON format
        const result = rows.map(row => ({
            MenuItemID: row.MenuItemID,
            Name: row.Name,
            CostPrice: row.CostPrice,
            ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
        }));
    
        res.status(200).json(result);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const create = async (req, res) => {
    try {
        const {restaurant_id} = req.params;
        const { MenuItemID, CostPrice, items } = req.body;

        // Start a transaction
        await poolConnection.query('START TRANSACTION');

        try {
            // Check if MenuItemID already exists
            const checkMenuItemQuery = 'SELECT COUNT(*) AS count FROM recipe_items WHERE MenuItemID = ? AND restaurant_id = ?';
            const result = await poolConnection.query(checkMenuItemQuery, [MenuItemID, restaurant_id]);
            const menuItemExists = result[0].count > 0;

            if (menuItemExists) {
                res.status(400).json({status: 400, message: 'Menu Item already exists!' });
                return;
            }

            // Update menuitems table with CostPrice
            await poolConnection.query('UPDATE menuitems SET CostPrice = ? WHERE MenuItemID = ? AND restaurant_id = ?', [CostPrice, MenuItemID, restaurant_id]);

            // Insert items into recipe_items table
            for (const item of items) {
                const { IngredientID, PerItemPrice, Grams } = item;

                await poolConnection.query(
                    'INSERT INTO recipe_items (MenuItemID, IngredientID, PerItemPrice, Grams, restaurant_id) VALUES (?, ?, ?, ?, ?)',
                    [MenuItemID, IngredientID, PerItemPrice, Grams, restaurant_id]
                );
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(201).json({status: 201, message: 'Recipe items created successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { MenuItemID, IngredientID, PerItemPrice, Grams, CostPrice } = req.body;

        // Start a transaction
        await poolConnection.query('BEGIN TRANSACTION');

        try {
            // Update menuitems table with CostPrice
            await poolConnection.query('UPDATE menuitems SET CostPrice = ? WHERE MenuItemID = ?', [CostPrice, MenuItemID]);

            const result = await poolConnection.query(
                'UPDATE recipe_items SET MenuItemID = ?, IngredientID = ?, PerItemPrice = ?, Grams = ? WHERE RecipeItemID = ?',
                [MenuItemID, IngredientID, PerItemPrice, Grams, id]
            );

            if (result[0].affectedRows === 0) {
                // Rollback the transaction if the recipe item is not found
                await poolConnection.query('ROLLBACK');
                return res.status(404).json({status: 404, message: 'Recipe item not found!' });
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(200).json({status: 200, message: 'Recipe item updated successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await poolConnection.query('SELECT * FROM recipe_items WHERE RecipeItemID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({status: 404, message: 'Recipe item not found!' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const deleteItem = async (req, res) => {
    try {
        const id = req.params.id;

        // Start a transaction
        await poolConnection.query('BEGIN TRANSACTION');

        try {
            const result = await poolConnection.query('DELETE FROM recipe_items WHERE RecipeItemID = ?', [id]);

            if (result[0].affectedRows === 0) {
                // Rollback the transaction if the recipe item is not found
                await poolConnection.query('ROLLBACK');
                return res.status(404).json({status: 404, message: 'Recipe item not found!' });
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(200).json({status: 200, message: 'Recipe item deleted successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};



module.exports = {
    getAll,
    create,
    getAllWithIngredients,
    update,
    getById,
    deleteItem
}