const poolConnection = require('../../config/database');

const getAllInstances = async (req, res) => {
    try {
        // Fetch data from the database
        const rows = await poolConnection.query('SELECT * FROM WhatsAppInstances');
    
        // Send the data as a JSON response
        res.status(200).json(rows);
      } catch (error) {
        console.error(`Error fetching WhatsAppInstances: ${error}`);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}

const update = async (req, res) => {
    
};

const create = async (req, res) => {

};

module.exports = {
    getAllInstances
};