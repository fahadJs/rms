const poolConnection = require('../../config/database');

const getById = async (req, res) => {
    try {
        let id = req.params.id;
        let sql = 'SELECT floor_plan_data FROM floor_plans WHERE restaurant_id = ?';
        let values = id;
        const result = await poolConnection.query(sql, values);

        const floorData = result.map(results => {
            const floorPlanData = JSON.parse(results.floor_plan_data);
            return {
                floor_plan_data: {
                    floor: floorPlanData.floor,
                    tables: floorPlanData.tables
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