const poolConnection = require('../../config/database');

const getById = async (req, res) => {
    try {
        let id = req.params.id;
        // let sql = 'SELECT floor_plan_data FROM floor_plans WHERE restaurant_id = ?';
        let sql = 'SELECT * FROM floor_plans JOIN floors ON floor_plans.restaurant_id = floors.restaurant_id LEFT JOIN tables ON floors.floor_id = tables.floor_id WHERE floor_plans.restaurant_id = ?';
        let values = id;
        const result = await poolConnection.query(sql, values);

        const floorData = result.map(results => {
            return {
                floor_plan_data: {
                    floor: results.floor_name,
                    tables: {
                        seats: results.seats,
                        status: results.status,
                        table_id: results.table_name
                    }
                }
            }
        });

        res.status(200).json(floorData);
    } catch (error) {
        console.error(`Error executing query! Error: ${error}`);
        res.status(500).json('Error while Fetching floors plans!');
    }
}

module.exports = {
    getById
}