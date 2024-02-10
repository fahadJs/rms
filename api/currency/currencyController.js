const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
  try {
    const selectCurrencyQuery = 'SELECT * FROM currency';
    const currency = await poolConnection.query(selectCurrencyQuery);

    res.status(200).json(currency);
  } catch (error) {
    console.log(`Error! ${error.message}`);
    res.status(500).json({ status: 500, message: error.message });
  }
}

const update = async (req, res) => {
  const { restaurantId } = req.params;
  const { currency } = req.body;
  try {
    const updateCurrencyQuery = `UPDATE restaurants SET default_currency = ? WHERE restaurant_id = ?`;
    const updateCurrency = await poolConnection.query(updateCurrencyQuery, [currency, restaurantId]);

    res.status(201).json({ status: 201, message: 'Currency Updated successfully!' });
  } catch (error) {
    console.log(`Error! ${error.message}`);
    res.status(500).json({ status: 500, message: error.message });
  }
}

module.exports = {
  getAll,
  update
}