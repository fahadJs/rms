const poolConnection = require('../../config/database');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const getAll = async (req, res) => {
    try {

        const { restaurant_id } = req.params;
        const getKitchensQuery = `SELECT * FROM kitchens WHERE restaurant_id = ? AND visible = 'true'`;
        const kitchens = await poolConnection.query(getKitchensQuery, [restaurant_id]);

        if (kitchens.length === 0) {
            return res.status(404).json({ status: 404, message: 'Kitchen not found!' });
        }

        res.status(200).json(kitchens);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const { name } = req.body;

        const checkKitchen = 'SELECT COUNT(*) as count FROM kitchens WHERE Name = ? AND restaurant_id = ?';
        const checkKitchenRes = await poolConnection.query(checkKitchen, [name, restaurant_id]);

        if (checkKitchenRes.count > 0) {
            throw new Error('Kitchen Already exist!');
        }

        const addKitchenQuery = 'INSERT INTO kitchens (Name, restaurant_id) VALUES (?, ?)';
        const addKitchenValues = [name, restaurant_id];

        await poolConnection.query(addKitchenQuery, addKitchenValues);

        res.status(201).json({ status: 201, message: 'Kitchen added successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { kitchenId, restaurant_id } = req.params;
        const { name } = req.body;

        const updateKitchenQuery = 'UPDATE kitchens SET Name = ? WHERE KitchenID = ? AND restaurant_id = ?';
        const updateKitchenValues = [name, kitchenId, restaurant_id];

        await poolConnection.query(updateKitchenQuery, updateKitchenValues);

        res.status(200).json({ status: 200, message: 'Kitchen updated successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const { kitchenId, restaurant_id } = req.params;

        const deleteKitchenQuery = 'DELETE FROM kitchens WHERE KitchenID = ? AND restaurant_id = ?';
        const deleteKitchenValues = [kitchenId, restaurant_id];

        await poolConnection.query(deleteKitchenQuery, deleteKitchenValues);

        res.status(200).json({ status: 200, message: 'Kitchen deleted successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { kitchenId, restaurant_id } = req.params;

        const getKitchenQuery = `SELECT * FROM kitchens WHERE KitchenID = ? AND restaurant_id = ? AND visible = 'true'`;
        const kitchenResult = await poolConnection.query(getKitchenQuery, [kitchenId, restaurant_id]);

        if (kitchenResult.length === 0) {
            return res.status(404).json({ status: 404, message: 'Kitchen not found!' });
        }

        const kitchenDetails = kitchenResult[0];
        res.status(200).json(kitchenDetails);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const kLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getKitchenQuery = 'SELECT * FROM kitchens WHERE login_id = ?';
        const result = await poolConnection.query(getKitchenQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({ status: 404, message: 'Kitchen not found!' });
            return;
        }

        const kitchen = result[0];

        const getRestaurantQuery = 'SELECT * FROM restaurants WHERE restaurant_id = ?';
        const restaurantResult = await poolConnection.query(getRestaurantQuery, [kitchen.restaurant_id]);

        const restaurants = restaurantResult[0];

        if (kitchen.login_pass === login_pass) {
            const tokenPayload = {
                KitchenID: kitchen.KitchenID,
                restaurant_id: kitchen.restaurant_id || null,
                Name: kitchen.Name,
                currency: restaurants.default_currency,
                restaurant_name: restaurants.name,
                // tax: restaurants.tax,
                // time: time,
                // daily_cash_sales: totalDailyCashSales,
                // monthly_cash_sales: totalMonthlyCashSales,
            };

            const token = jwt.sign(tokenPayload, 'RMSIDVERFY', { expiresIn: '6h' });

            res.status(200).json({
                status: 200,
                message: 'Login successful!',
                // waiter_id: tokenPayload.waiter_id,
                // restaurant_id: tokenPayload.restaurant_id,
                // waiter_name: tokenPayload.waiter_name,
                // currency: tokenPayload.currency,
                // restaurant_name: tokenPayload.restaurant_name,
                // tax: tokenPayload.tax,
                // time: tokenPayload.time,
                // daily_cash_sales: totalDailyCashSales,
                // monthly_cash_sales: totalMonthlyCashSales,
                tokenPayload,
                token,
            });
        } else {
            res.status(401).json({ status: 401, message: 'Incorrect password!' });
        }
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    kLogin
}