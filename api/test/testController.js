const poolConnection = require('../../config/database');

const create = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { name, price } = req.params;

        const insertTestQuery = 'INSERT INTO test (testName, testPrice) VALUES (?, ?)';
        await poolConnection.query(insertTestQuery, [name, price]);

        await poolConnection.query('COMMIT');
        res.status(201).json({status: 201, message: 'test record created successfully!' });
    } catch (error) {
        await poolConnection.query('ROLLBACK');
        console.error(`Error creating test record! Error: ${error}`);
        res.status(500).json({status: 500, message: 'Error creating test record!' });
    }
};

module.exports = {
    create
}