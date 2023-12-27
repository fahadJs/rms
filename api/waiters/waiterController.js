const poolConnection = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const create = async (req, res) => {
    try {
        const { waiter_name, login_id, login_pass, restaurant_id } = req.body;

        const hashedPassword = await bcrypt.hash(login_pass, 10);

        const insertWaiterQuery = 'INSERT INTO waiters (waiter_name, login_id, login_pass, restaurant_id) VALUES (?, ?, ?, ?)';
        const insertWaiterValues = [waiter_name, login_id, hashedPassword, restaurant_id];
        await poolConnection.query(insertWaiterQuery, insertWaiterValues);

        res.status(201).json({status: 201, message: 'Waiter created successfully!' });
    } catch (error) {
        console.error(`Error creating waiter! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error creating waiter!' });
    }
}

const wLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getWaiterQuery = 'SELECT * FROM waiters WHERE login_id = ?';
        const result = await poolConnection.query(getWaiterQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({status: 404, message: 'Waiter not found!' });
            return;
        }

        const waiter = result[0];

        if (waiter.status != "allowed" ) {
            res.status(400).json({status: 400, message: 'Waiter is not allowed!' });
            return;
        }

        const passwordMatch = await bcrypt.compare(login_pass, waiter.login_pass);

        if (passwordMatch) {
            const tokenPayload = {
                waiter_id: waiter.waiter_id,
                restaurant_id: waiter.restaurant_id || null,
            };

            const token = jwt.sign(tokenPayload, 'RMSIDVERFY');

            res.status(200).json({
                message: 'Login successful!',
                waiter_id: waiter.waiter_id,
                restaurant_id: waiter.restaurant_id || null,
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

const getAll = async (req, res) => {
    try {
        const getWaitersQuery = 'SELECT * FROM waiters';
        const waiters = await poolConnection.query(getWaitersQuery);

        res.status(200).json(waiters);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching waiters!' });
    }
}

const getById = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const getWaiterQuery = 'SELECT * FROM waiters WHERE waiter_id = ?';
        const result = await poolConnection.query(getWaiterQuery, [waiterId]);

        if (result.length === 0) {
            res.status(404).json({status: 404, message: 'Waiter not found!' });
            return;
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error(`Error fetching waiter! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error fetching waiter!' });
    }
}

const update = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const { waiter_name, login_id, login_pass, restaurant_id, status } = req.body;

        // Hash the password before updating it
        const hashedPassword = await bcrypt.hash(login_pass, 10);

        const updateWaiterQuery = 'UPDATE waiters SET waiter_name = ?, login_id = ?, login_pass = ?, restaurant_id = ?, status = ? WHERE waiter_id = ?';
        const updateWaiterValues = [waiter_name, login_id, hashedPassword, restaurant_id, status, waiterId];
        await poolConnection.query(updateWaiterQuery, updateWaiterValues);

        res.status(200).json({status: 200, message: 'Waiter updated successfully!' });
    } catch (error) {
        console.error(`Error updating waiter! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error updating waiter!' });
    }
}

const wdelete = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const deleteWaiterQuery = 'DELETE FROM waiters WHERE waiter_id = ?';
        await poolConnection.query(deleteWaiterQuery, [waiterId]);

        res.status(200).json({status: 200, message: 'Waiter deleted successfully!' });
    } catch (error) {
        console.error(`Error deleting waiter! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error deleting waiter!' });
    }
}


module.exports = {
    create,
    wLogin,
    getAll,
    getById,
    update,
    wdelete
}