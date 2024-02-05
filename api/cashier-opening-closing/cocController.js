const poolConnection = require('../../config/database');

const getDenominations = async (req, res) => {
    try {
        // await poolConnection.query('START TRANSACTION');
        const {restaurant_id} = req.params;

        const getRestaurant = `
            SELECT
                *
            FROM
                denomination_details details
            JOIN
                denomination denom ON details.denom_id = denom.denom_id
            JOIN
                restaurants rest ON rest.denom_id = denom.denom_id
            WHERE
                rest.restaurant_id = ?;
        `;
        const getRestaurantRes = await poolConnection.query(getRestaurant, [restaurant_id]);
        // const denomination = getRestaurantRes[0];

        const formattedOutput = {
            restaurant_id: null,
            name: null,
            denomination_details: []
        };
    
        if (getRestaurantRes.length > 0) {
            formattedOutput.restaurant_id = getRestaurantRes[0].restaurant_id;
            formattedOutput.name = getRestaurantRes[0].name;
    
            formattedOutput.denomination_details = getRestaurantRes.map(row => ({
                // denom_id: row.denom_details_id,
                denom_name: row.denom_key,
            }));
        }

        res.json(formattedOutput);
        
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({status: 500, message: error.message});
    }
}

module.exports = {
    getDenominations
}