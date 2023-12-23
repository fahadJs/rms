const poolConnection = require("../../config/database");

// Function to check if an item with the same name already exists
// async function isMenuItemExistsInRecipe(MenuItemID) {
//     const rows = await poolConnection.query('SELECT COUNT(*) AS count FROM recipe_items WHERE MenuItemID = ?', [MenuItemID]);
//     return rows[0].count > 0;
// }

// Function to check if a MenuItemID exists
// async function doesMenuItemExist(menuItemId) {
//     const rows = await poolConnection.query('SELECT COUNT(*) AS count FROM menuitems WHERE MenuItemID = ?', [menuItemId]);
//     return rows[0].count > 0;
// }

const getAll = async (req, res) => {
    try {
        const rows = await poolConnection.query('SELECT * FROM recipe_items');
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching recipe items! ${error.message}`);
        res.status(500).json({ error: `Error fetching recipe items! ${error.message}` });
    }
};

const create = async (req, res) => {
    try {
        const { MenuItemID, CostPrice, items } = req.body;

        // Check if the MenuItemID exists
        // const menuItemExists = await doesMenuItemExist(MenuItemID);
        // if (!menuItemExists) {
        //     return res.status(404).json({ error: 'Menu item not found!' });
        // }

        // Start a transaction
        await poolConnection.query('START TRANSACTION');

        try {
            // Update menuitems table with CostPrice
            await poolConnection.query('UPDATE menuitems SET CostPrice = ? WHERE MenuItemID = ?', [CostPrice, MenuItemID]);

            // Insert items into recipe_items table
            for (const item of items) {
                const { IngredientID, PerItemPrice, Grams } = item;

                // Check if the item name already exists
                // const IngredientIDExists = await isMenuItemExistsInRecipe(MenuItemID);
                // if (IngredientIDExists) {
                //     // Rollback the transaction if the item name already exists
                //     await poolConnection.query('ROLLBACK');
                //     return res.status(400).json({ error: 'Item name already exists!' });
                // }

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

        // Check if the MenuItemID exists
        const menuItemExists = await doesMenuItemExist(MenuItemID);
        if (!menuItemExists) {
            return res.status(404).json({ error: 'Menu item not found!' });
        }

        // Check if the item name already exists
        const IngredientIDExists = await isMenuItemExistsInRecipe(MenuItemID);
        if (IngredientIDExists) {
            return res.status(400).json({ error: 'Item name already exists!' });
        }

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
    update,
    getById,
    deleteItem
}