const { emitOrder } = require('../../app');
const poolConnection = require('../../config/database');

const testScoket = async (req, res) => {
    try {
        const { orderId } = req.params;
        // const getTheOrder = `SELECT * FROM pos_orders WHERE PosOrderID = ?`;
        // const getTheOrderRes = await poolConnection.query(getTheOrder, [orderId]);

        // const orderDetails = getTheOrderRes[0];

        emitOrder(orderId);

        res.status(200).json({status: 200, message: `Order successfully emmitted!`});

    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

module.exports = {
    testScoket,
}