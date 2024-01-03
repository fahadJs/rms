const poolConnection = require('../../config/database');

const getAll = async (req, res) => {
  try {
    const selectTimezonesQuery = 'SELECT * FROM timezones';
    const timezones = await poolConnection.query(selectTimezonesQuery);

    res.status(200).json(timezones);
  } catch (error) {
    console.error(`Error fetching time zones: ${error.message}`);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
}

const getDefault = async (req, res) => {
  const {restaurantId} = req.params;
  try {
    const defaultTimezonesQuery = 'SELECT * FROM restaurants WHERE restaurant_id = ?';
    const timezone = await poolConnection.query(defaultTimezonesQuery, [restaurantId]);

    res.status(200).json({timezone});
  } catch (error) {
    console.error(`Error fetching time zones: ${error.message}`);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
}


const update = async (req, res) => {
  const {restaurantId} = req.params;
  const {time_zone} = req.body;
  try {
    const updateTimezonesQuery = `UPDATE restaurants SET time_zone = ? WHERE restaurant_id = ?`;
    const updateTimezones = await poolConnection.query(updateTimezonesQuery, [time_zone, restaurantId]);

    res.status(201).json({status: 201, message: 'Timezone Updated successfully!'});
  } catch (error) {
    console.error(`Error updating time zones: ${error.message}`);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
}

module.exports = {
  getAll,
  update,
  getDefault
}