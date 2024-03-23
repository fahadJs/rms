const poolConnection = require('../../config/database');

const addDailyFixedCost = async (req, res) => {
    try {
        const { restaurant_id } = req.params;
        const { fixedCost } = req.body;

        const fixedDailyCost = fixedCost / 30;

        const checkExist = `SELECT * FROM res_fix_cost_monthly WHERE restaurant_id = ?`;
        const checkExistRes = await poolConnection.query(checkExist, [restaurant_id]);

        if (checkExistRes.length > 0) {
            console.log('Cost Already Set! Try to update it.');
            throw new Error('Cost Already Set! Try to update it.');
        }

        const fixedCostQuery = `INSERT INTO res_fix_cost_monthly (fixCostMonthly, currentCost, fixedDailyCost, restaurant_id) VALUES (?, ?, ?, ?)`;
        const fixedCostQueryResult = await poolConnection.query(fixedCostQuery, [fixedCost, fixedDailyCost.toFixed(2), fixedDailyCost.toFixed(2), restaurant_id]);

        res.status(201).json({ status: 201, message: 'Fixed Cost Set, Successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getDailyFixedCost = async (req, res) => {
    try {
        const { restaurant_id } = req.params;

        const getFixedCost = `SELECT * FROM res_fix_cost_monthly WHERE restaurant_id = ?`;
        const getFixedCostRes = await poolConnection.query(getFixedCost, [restaurant_id]);

        if (getFixedCostRes == 0) {
            console.log('Cost Not Found, Try to Create!');
            throw new Error('Cost Not Found, Try to Create!');
        }

        const details = getFixedCostRes[0];

        res.status(200).json(
            ...getFixedCostRes
        );

    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    addDailyFixedCost,
    getDailyFixedCost
}