const poolConnection = require('../../config/database');

const addDailyFixedCost = async (req, res) => {
    try {
        await poolConnection.query('START TRANSACTION');

        const { restaurant_id } = req.params;
        const { fixedCost, percent } = req.body;

        const fixedDailyCost = fixedCost / 30;

        const checkExist = `SELECT * FROM res_fix_cost_monthly WHERE restaurant_id = ?`;
        const checkExistRes = await poolConnection.query(checkExist, [restaurant_id]);

        if (checkExistRes.length > 0) {
            console.log('Cost Already Set! Try to update it.');
            throw new Error('Cost Already Set! Try to update it.');
        }

        const fixedCostQuery = `INSERT INTO res_fix_cost_monthly (fixCostMonthly, currentCost, fixedDailyCost, restaurant_id) VALUES (?, ?, ?, ?)`;
        await poolConnection.query(fixedCostQuery, [fixedCost, '0', fixedDailyCost.toFixed(2), restaurant_id]);

        const menuitemsCost = `SELECT * FROM menuitems WHERE restaurant_id = ?`;
        const menuitemsCostRes = await poolConnection.query(menuitemsCost, [restaurant_id]);

        menuitemsCostRes.forEach(async item => {
            const cost = item.CostPrice;
            let percent = item.FixedCostPercent;
            percent = parseInt(percent);

            let addedCost = (percent / 100) * cost;
            addedCost = cost + addedCost;

            // console.log(cost, percent, addedCost, addedCost);

            const updateAddedFixedCost = `UPDATE menuitems SET AddedFixedCost = ? WHERE MenuItemID = ?`;
            await poolConnection.query(updateAddedFixedCost, [addedCost, item.MenuItemID]);
        });

        await poolConnection.query('COMMIT');

        res.status(201).json({ status: 201, message: 'Fixed Cost Set, Successfully!' });
    } catch (error) {
        console.log(`Error! ${error.message}`);
        await poolConnection.query('ROLLBACK');
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