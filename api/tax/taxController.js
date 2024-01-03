const poolConnection = require('../../config/database');

const updateTax = async (req, res) => {
    const { restaurantId } = req.params;
    const { tax } = req.body;
    try {
        const updateTimezonesQuery = `UPDATE restaurants SET tax = ? WHERE restaurant_id = ?`;
        const updateTimezones = await poolConnection.query(updateTimezonesQuery, [tax, restaurantId]);

        res.status(201).json({ status: 201, message: 'Tax Updated successfully!' });
    } catch (error) {
        console.error(`Error updating tax: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

module.exports = {
    updateTax
}