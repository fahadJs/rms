const poolConnection = require('../../config/database');

const createPayment = async (req, res) => {
    const { restaurantId } = req.params;
    const {p_name} = req.body;
    try {
        const createPaymentQuery = `INSERT INTO payment_methods (p_name, restaurant_id) VALUES (?, ?);`;
        const createPayment = await poolConnection.query(createPaymentQuery, [p_name, restaurantId]);

        res.status(201).json({ status: 201, message: "Payment method created successfully!" });
    } catch (error) {
        console.error(`Error creating payment method: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getAll = async (req, res) => {
    const {restaurantId} = req.params;
    try {
      const selectTimezonesQuery = 'SELECT * FROM payment_methods WHERE restaurant_id = ?';
      const timezones = await poolConnection.query(selectTimezonesQuery, [restaurantId]);
  
      res.status(200).json(timezones);
    } catch (error) {
      console.error(`Error fetching payment method: ${error.message}`);
      res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
  }

module.exports = {
    createPayment,
    getAll
}