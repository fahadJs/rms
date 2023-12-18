require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./config/database');
const itemRouter = require('./api/items/itemRouter');
const floorsRouter = require('./api/floors/floorRouter');
const caiRouter = require('./api/category-and-items/caiRouter');
const caikRouter = require('./api/category-and-items-kitchen/caikRouter');
const orderRouter = require('./api/order/orderRouter');
const inventoryRouter = require('./api/inventory/inventoryRouter');
const tdRouter = require('./api/table-details/tdRouter');
const bosyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bosyParser.json());
// app.use('/api/users', userRouter);
app.use('/api/items', itemRouter);
app.use('/api/floors', floorsRouter);
app.use('/api/cai', caiRouter);
app.use('/api/caik', caikRouter);
app.use('/api/order', orderRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/tabledetail', tdRouter);

app.listen(process.env.APP_PORT || 3000, () => {
    console.log(`Server up and running!\nConnection will be established once any request hits!`);
})