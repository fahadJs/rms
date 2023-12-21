const poolConnection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const create = async (req, res) => {
    
}

const adLogin = async (req, res) => {
    try {
        const { login_id, login_pass } = req.body;
        const getWaiterQuery = 'SELECT * FROM waiters WHERE login_id = ?';
        const result = await poolConnection.query(getWaiterQuery, [login_id]);

        if (result.length === 0) {
            res.status(404).json({ message: 'Waiter not found!' });
            return;
        }

        const waiter = result[0];

        if (waiter.status != 'allowed') {
            res.status(401).json({ message: 'Waiter is not Allowed!' });
            return;
        }
        const passwordMatch = await bcrypt.compare(login_pass, waiter.login_pass);

        if (passwordMatch) {
            const token = jwt.sign({ waiter_id: waiter.waiter_id }, 'RMSIDVERFY');
            const restaurant_id = waiter.restaurant_id;

            res.status(200).json({ message: 'Login successful!', token, restaurant_id });
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