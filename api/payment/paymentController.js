const poolConnection = require('../../config/database');

const createPayment = async (req, res) => {

  try {
    const { restaurantId } = req.params;
    const { p_name } = req.body;
    const checkPaymentMethod = `SELECT * FROM payment_methods WHERE p_name = ? AND restaurant_id = ?`;
    const checkPaymentMethodRes = await poolConnection.query(checkPaymentMethod, [p_name, restaurantId]);

    if (checkPaymentMethodRes.length > 0) {
      console.log('Payment Method already exist!');
      throw new Error('Payment Method already exist!');
    }

    const nameUpper = p_name.toUpperCase();

    const createPaymentQuery = `INSERT INTO payment_methods (p_name, restaurant_id, closing_balance) VALUES (?, ?, ?);`;
    await poolConnection.query(createPaymentQuery, [nameUpper, restaurantId, 0.00]);

    res.status(201).json({ status: 201, message: "Payment method created successfully!" });
  } catch (error) {
    console.error(`Error creating payment method: ${error.message}`);
    res.status(500).json({ status: 500, message: error.message });
  }
}

const getAll = async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const getPayments = `
      SELECT *
      FROM payment_methods 
      WHERE restaurant_id = ?
      `;
    const getPaymentsRes = await poolConnection.query(getPayments, [restaurantId]);

    let series = 1;
    const paymentsWithSeries = getPaymentsRes.map(payment => ({
        ...payment,
        series: series++
    }));

    res.status(200).json(paymentsWithSeries);
  } catch (error) {
    console.error(`Error fetching payment method: ${error.message}`);
    res.status(500).json({ status: 500, message: error.message });
  }
}

const updateBalance = async (req, res) => {
  try {
    const { closing_balance, p_id, restaurant_id } = req.params;

    const updateBalance = `UPDATE payment_methods SET closing_balance = ? WHERE p_id = ? AND restaurant_id = ?`;
    await poolConnection.query(updateBalance, [closing_balance, p_id, restaurant_id]);

    res.status(200).json({ status: 200, message: 'Updated Successfully!' });
  } catch (error) {
    console.error(`Error updating payment balance: ${error.message}`);
    res.status(500).json({ status: 500, message: error.message });
  }
}

module.exports = {
  createPayment,
  getAll,
  updateBalance,
}