const poolConnection = require('../../config/database');

const getById = async (req, res) => {
    try {
        let id = req.params.id;
        let sql = `SELECT *, tables.table_id FROM floor_plans JOIN floors ON floor_plans.restaurant_id = floors.restaurant_id LEFT JOIN tables ON floors.floor_id = tables.floor_id LEFT JOIN orders on tables.table_id = orders.table_id WHERE floor_plans.restaurant_id = ?`;
        let values = id;
        const result = await poolConnection.query(sql, values);

        const floorData = result.map(results => {
            return {
                floor_plan_data: {
                    floor: results.floor_name,
                    tables: {
                        seats: results.seats,
                        status: results.status,
                        table_id: results.table_id,
                        table_name: results.table_name,
                        payTime: results.pay_status === 'not-vacant' ? results.pay_time: null,
                        time: results.order_status === 'unpaid' ? results.time : null
                    }
                }
            }
        });

        res.status(200).json(floorData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    getById
}