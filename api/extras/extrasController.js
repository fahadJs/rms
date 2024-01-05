const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    const {restaurant_id, MenuItemID} = req.params;
    try {
        const getExtrasQuery = `SELECT * FROM menu_extras WHERE restaurant_id = ? AND MenuItemID = ?`;
        const getExtras = await poolConnection.query(getExtrasQuery, [restaurant_id, MenuItemID]);

        res.status(200).json(getExtras);
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error while getting extras!' });
    }
}

module.exports = {
    getAll
}