const poolConnection = require('../../config/database');
const axios = require('axios');

const getAllOrders = async (req, res) => {
    try {
        const apiUrl = 'https://anunziointernational.com/tanah/wp-json/wc/v3/orders';
        const consumerKey = 'ck_c15d5285e465d6db719d968294686266e9cce582';
        const consumerSecret = 'cs_20aa3433dd0742f26a7eb6b867b4834a3287a9f9';

        const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        axios.get(apiUrl, {
            headers: {
                Authorization: `Basic ${authString}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                const order = response.data;
                console.log('Data:', order);
                res.json(order);
            })
            .catch(error => {
                console.error('Error fetching data:', error.message);
            });
    } catch (error) {
        console.log(`Error! Fetching Orders! ${error}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error!' });
    }
}

module.exports = {
    getAllOrders
}