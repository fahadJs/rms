const poolConnection = require('../../config/database');
const bcrypt = require('bcrypt');

const create = async (req, res) => {
    try {
        const { name, username, password } = req.body;

        // Hashing the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const createWaiterQuery = 'INSERT INTO waiters (Name, Username, Password) VALUES (?, ?, ?)';
        const createWaiterValues = [name, username, hashedPassword];

        await poolConnection.query(createWaiterQuery, createWaiterValues);

        res.status(201).json({ message: 'Waiter created successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error creating waiter!' });
    }
}

const wLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Fetch the hashed password for the given username from the database
        const getPasswordQuery = 'SELECT Password FROM waiters WHERE Username = ?';
        const getPasswordValues = [username];
        const result = await poolConnection.query(getPasswordQuery, getPasswordValues);

        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const hashedPassword = result[0].Password;

        // Compare the entered password with the hashed password from the database
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (passwordMatch) {
            // Passwords match, login successful
            res.status(200).json({ message: 'Login successful!' });
        } else {
            // Passwords don't match, login failed
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error during login!' });
    }
}

const getAll = async (req, res) => {
    try {
        const getWaitersQuery = 'SELECT * FROM waiters';
        const waiters = await poolConnection.query(getWaitersQuery);

        res.status(200).json(waiters);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error fetching waiters!' });
    }
}

const getById = async (req, res) => {

}

const update = async (req, res) => {
    try {
        const waiterId = req.params.id;
        const { name, username, password } = req.body;

        // Hashing the updated password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const updateWaiterQuery = 'UPDATE waiters SET Name = ?, Username = ?, Password = ? WHERE WaiterID = ?';
        const updateWaiterValues = [name, username, hashedPassword, waiterId];

        await poolConnection.query(updateWaiterQuery, updateWaiterValues);

        res.status(200).json({ message: 'Waiter updated successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error updating waiter!' });
    }
}

const wdelete = async (req, res) => {
    try {
        const waiterId = req.params.id;

        const deleteWaiterQuery = 'DELETE FROM waiters WHERE WaiterID = ?';
        const deleteWaiterValues = [waiterId];

        await poolConnection.query(deleteWaiterQuery, deleteWaiterValues);

        res.status(200).json({ message: 'Waiter deleted successfully!' });
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json({ error: 'Error deleting waiter!' });
    }
}


module.exports = {

}