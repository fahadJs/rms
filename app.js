require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const { emitOrderToKitchen } = require('./socket/socketEmits');

const app = express();
const port = 443;

const options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.pem'),
};

const itemRouter = require('./api/items/itemRouter');
const floorsRouter = require('./api/floors/floorRouter');
const caiRouter = require('./api/category-and-items/caiRouter');
const caikRouter = require('./api/category-and-items-kitchen/caikRouter');
const orderRouter = require('./api/order/orderRouter');

// Duplicate FOR TESTING
const duplicate = require('./api/order-duplicate/orderRouter');

const inventoryRouter = require('./api/inventory/inventoryRouter');
const tdRouter = require('./api/table-details/tdRouter');
const categoryRouter = require('./api/category/categoryRouter');
const scRouter = require('./api/sub-category/scRouter');
const kitchenRouter = require('./api/kitchen/kitchenRouter');
const waiterRouter = require('./api/waiters/waiterRouter');
const posorderRouter = require('./api/pos-orders/posorderRouter');
const splitBillRouter = require('./api/split-bill/splitBillRouter');
const ingredientsRouter = require('./api/ingredient/ingredientRouter');
const riRouter = require('./api/recipe-items/riRouter');
const timeRouter = require('./api/timezones/timeRouter');
const currencyRouter = require('./api/currency/currencyRouter');
const expenseRouter = require('./api/expense/expenseRouter');
const taxRouter = require('./api/tax/taxRouter');
const paymentRouter = require('./api/payment/paymentRouter');
const wcsRouter = require('./api/waiter-cash-sales/wcsRouter');
const tnRouter = require('./api/targetNumbers/tnRouter');
const cocRouter = require('./api/cashier-opening-closing/cocRouter');
const sumRouter = require('./api/summary/sumRouter');

// SOCKET TEST
const socketRouter = require('./api/socket/socketRouter');

// TEST RMS CPANEL
const testRmsRouter = require('./api/test-rms/testRmsRouter');

// Woo Scripts
const tanahCowRouter = require('./api/woo-scripts/tanah/cowRouter');

// Parameter Testing
const testRouter = require('./api/test/testRouter');

// Telegram
const telegramRouter = require('./api/telegram/telegramRouter');

// Whatsapp
const whatsappRouter = require('./api/whatsapp/whatsappRouter');

// Admin
const adminRouter = require('./admin/adminRouter');
const bosyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bosyParser.json());
app.use('/api/items', itemRouter);
app.use('/api/floors', floorsRouter);
app.use('/api/cai', caiRouter);
app.use('/api/caik', caikRouter);
app.use('/api/order', orderRouter);

// For Testing
app.use('/api/duplicate', duplicate);

app.use('/api/inventory', inventoryRouter);
app.use('/api/tabledetail', tdRouter);
app.use('/api/category', categoryRouter);
app.use('/api/subcategory', scRouter);
app.use('/api/kitchen', kitchenRouter);
app.use('/api/waiter', waiterRouter);
app.use('/api/posorders', posorderRouter);
app.use('/api/split', splitBillRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipeitems', riRouter);
app.use('/api/timezones', timeRouter);
app.use('/api/currency', currencyRouter)
app.use('/api/expense', expenseRouter);
app.use('/api/tax', taxRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/wcs', wcsRouter);
app.use('/api/tasksoftware/numbers', tnRouter);
app.use('/api/coc', cocRouter);
app.use('/api/summary', sumRouter);

// SOCKET
app.use('/api/socket', socketRouter);

// TEST RMS CPANEL
app.use('/api/testrms', testRmsRouter);

// WOO Scripts
app.use('/api/woo/tanah', tanahCowRouter);

// For Parameter Testing
app.use('/api/test', testRouter);

// Telegram
app.use('/api/telegram', telegramRouter);

// Whatsapp
app.use('/api/whatsapp', whatsappRouter);

// Admin
app.use('/admin', adminRouter);

const server = https.createServer(options, app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A client connected');
    // console.log(socket);

    // socket.on('userInput', (data) => {
    //     console.log('User input emitted:', data);
    //     io.emit('userInput', data);

    //     emitOrder(data.orderId);
    // });

    // When a kitchen client joins a room
    socket.on('joinKitchen', (kitchenID) => {
        // Join the room corresponding to the kitchen ID
        socket.join(`kitchen-${kitchenID}`);
        console.log(`Kitchen with ID ${kitchenID} joined room`);

        // Call emitOrderToKitchen function when a client joins a kitchen
        // You need to import emitOrderToKitchen function from wherever it is defined
        const orderDetails = {}; // Define your order details here
        emitOrderToKitchen(kitchenID, orderDetails);// Adjust the parameters as needed
    });
    // Handle disconnect event if needed
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

server.listen(port || 3000, () => {
    console.log(`Server up and running!\nConnection will be established once any request hits!`);
})

module.exports = {
    io
}