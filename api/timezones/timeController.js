const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const selectTimezonesQuery = 'SELECT * FROM timezones';
        const timezones = await poolConnection.query(selectTimezonesQuery);
    
        res.status(200).json(timezones);
      } catch (error) {
        console.error(`Error fetching time zones: ${error.message}`);
        res.status(500).json({status: 500, message: 'Internal Server Error' });
      }
}

module.exports = {
    getAll
}