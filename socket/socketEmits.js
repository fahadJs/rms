const io = require('../app');

const emitOrderToKitchen = (kitchenID, orderDetails) => {
    io.emit('newOrder', orderDetails);
};

module.exports = {
    emitOrderToKitchen
};
