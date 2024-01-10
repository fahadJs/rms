const poolConnection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const create = async (req, res) => {
    try {
        const { login_id, login_pass, restaurant_id } = req.body;

        // Hash the password
        // const hashedPassword = await bcrypt.hash(login_pass, 10);

        // Insert admin into the database
        const insertAdminQuery = 'INSERT INTO admins (login_id, login_pass, restaurant_id) VALUES (?, ?, ?)';
        const insertAdminValues = [login_id, login_pass, restaurant_id];
        await poolConnection.query(insertAdminQuery, insertAdminValues);

        res.status(201).json({status: 201, message: 'Admin created successfully!' });
    } catch (error) {
        console.error(`Error creating admin! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error creating admin!' });
    }
}

const adLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getAdminQuery = 'SELECT * FROM admins WHERE login_id = ?';
        const result = await poolConnection.query(getAdminQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({status: 404, message: 'Admin not found!' });
            return;
        }

        const admin = result[0];

        const getRestaurantCurrency = 'SELECT * FROM restaurants WHERE restaurant_id = ?';
        const currencyResult = await poolConnection.query(getRestaurantCurrency, [admin.restaurant_id]);

        // const passwordMatch = await bcrypt.compare(login_pass, admin.login_pass);

        if (admin.login_pass === login_pass) {
            const tokenPayload = {
                admin_id: admin.admin_id,
                restaurant_id: admin.restaurant_id || null,
                restaurant_name: currencyResult[0].name,
                currency: currencyResult[0].default_currency,
                tax: currencyResult[0].tax
            };

            const token = jwt.sign(tokenPayload, 'RMSIDVERFY', {expiresIn: '6h'});

            res.status(200).json({
                status: 200,
                message: 'Login successful!',
                admin_id: tokenPayload.admin_id,
                restaurant_id: tokenPayload.restaurant_id,
                currency: tokenPayload.currency,
                tax: tokenPayload.tax,
                restaurant_name: tokenPayload.restaurant_name,
                token,
            });
        } else {
            res.status(401).json({status: 401, message: 'Incorrect password!' });
        }
    } catch (error) {
        console.error(`Error logging in! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error logging in!' });
    }
}



module.exports = {
    create,
    adLogin,
}