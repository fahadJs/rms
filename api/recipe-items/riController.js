const poolConnection = require("../../config/database");

const getAll = async (req, res) => {
    try {
        const rows = await poolConnection.query('SELECT * FROM recipe_items');
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching recipe items! ${error.message}`);
        res.status(500).json({ error: `Error fetching recipe items! ${error.message}` });
    }
};

const getAllWithIngredients = async (req, res) => {
    try {
        const query = `
            SELECT
                recipe_items.*,
                JSON_ARRAYAGG(JSON_OBJECT('IngredientName', ingredients.IngredientName, 'PricePerGm', ingredients.PricePerGm)) AS ingredients
            FROM
                recipe_items
            INNER JOIN
                ingredients ON recipe_items.IngredientID = ingredients.IngredientID
            GROUP BY
                recipe_items.MenuItemID, recipe_items.IngredientID
        `;

        const rows = await poolConnection.query(query);

        // Parse the ingredients column to ensure proper JSON format
        const result = rows.map(row => ({
            ...row,
            ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error(`Error fetching recipe items with ingredients! ${error.message}`);
        res.status(500).json({ error: `Error fetching recipe items with ingredients! ${error.message}` });
    }
}

const create = async (req, res) => {
    try {
        const { MenuItemID, CostPrice, items } = req.body;

        // Start a transaction
        await poolConnection.query('START TRANSACTION');

        try {
            // Check if MenuItemID already exists
            const checkMenuItemQuery = 'SELECT COUNT(*) AS count FROM recipe_items WHERE MenuItemID = ?';
            const result = await poolConnection.query(checkMenuItemQuery, [MenuItemID]);
            const menuItemExists = result[0].count > 0;

            if (menuItemExists) {
                res.status(400).json({ error: 'Menu Item already exists!' });
                return;
            }

            // Update menuitems table with CostPrice
            await poolConnection.query('UPDATE menuitems SET CostPrice = ? WHERE MenuItemID = ?', [CostPrice, MenuItemID]);

            // Insert items into recipe_items table
            for (const item of items) {
                const { IngredientID, PerItemPrice, Grams } = item;

                await poolConnection.query(
                    'INSERT INTO recipe_items (MenuItemID, IngredientID, PerItemPrice, Grams) VALUES (?, ?, ?, ?)',
                    [MenuItemID, IngredientID, PerItemPrice, Grams]
                );
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(201).json({ message: 'Recipe items created successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error(`Error creating recipe items! ${error.message}`);
        res.status(500).json({ error: `Error creating recipe items! ${error.message}` });
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
                return res.status(404).json({ error: 'Recipe item not found!' });
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(200).json({ message: 'Recipe item updated successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error(`Error updating recipe item! ${error.message}`);
        res.status(500).json({ error: `Error updating recipe item! ${error.message}` });
    }
};

const getById = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await poolConnection.query('SELECT * FROM recipe_items WHERE RecipeItemID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Recipe item not found!' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Error fetching recipe item by ID! ${error.message}`);
        res.status(500).json({ error: `Error fetching recipe item by ID! ${error.message}` });
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
                return res.status(404).json({ error: 'Recipe item not found!' });
            }

            // Commit the transaction
            await poolConnection.query('COMMIT');

            res.status(200).json({ message: 'Recipe item deleted successfully!' });
        } catch (error) {
            // Rollback the transaction on error
            await poolConnection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error(`Error deleting recipe item! ${error.message}`);
        res.status(500).json({ error: `Error deleting recipe item! ${error.message}` });
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