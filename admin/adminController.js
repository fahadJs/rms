const poolConnection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const create = async (req, res) => {
    try {
        const { login_id, login_pass, restaurant_id } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(login_pass, 10);

        // Insert admin into the database
        const insertAdminQuery = 'INSERT INTO admins (login_id, login_pass, restaurant_id) VALUES (?, ?, ?)';
        const insertAdminValues = [login_id, hashedPassword, restaurant_id];
        await poolConnection.query(insertAdminQuery, insertAdminValues);

        res.status(201).json({ message: 'Admin created successfully!' });
    } catch (error) {
        console.error(`Error creating admin! Error: ${error}`);
        res.status(500).json({ error: 'Error creating admin!' });
    }
}

const adLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getAdminQuery = 'SELECT * FROM admins WHERE login_id = ?';
        const result = await poolConnection.query(getAdminQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({ message: 'Admin not found!' });
            return;
        }

        const admin = result[0];

        const passwordMatch = await bcrypt.compare(login_pass, admin.login_pass);

        if (passwordMatch) {
            const tokenPayload = {
                admin_id: admin.admin_id,
                restaurant_id: admin.restaurant_id || null, // Use restaurant_id if available, otherwise null
            };

            const token = jwt.sign(tokenPayload, 'RMSIDVERFY');

            res.status(200).json({
                message: 'Login successful!',
                admin_id: admin.admin_id,
                restaurant_id: admin.restaurant_id || null,
                token,
            });
        } else {
            res.status(401).json({ message: 'Incorrect password!' });
        }
    } catch (error) {
        console.error(`Error logging in! Error: ${error}`);
        res.status(500).json({ error: 'Error logging in!' });
    }
}



module.exports = {
    create,
    adLogin,
}