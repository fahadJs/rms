const io = require('../app');

const emitOrderToKitchen = (kitchenID, orderDetails) => {
    io.to(`kitchen-${kitchenID}`).emit('newOrder', orderDetails);
};

module.exports = {
    emitOrderToKitchen
};
