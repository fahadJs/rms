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
const categoryRouter = require('./api/category/categoryRouter');
const scRouter = require('./api/sub-category/scRouter');
const kitchenRouter = require('./api/kitchen/kitchenRouter');
const waiterRouter = require('./api/waiters/waiterRouter');
const posorderRouter = require('./api/pos-orders/posorderRouter');
const splitBillRouter = require('./api/split-bill/splitBillRouter');
const ingredientsRouter = require('./api/ingredient/ingredientRouter');
const riRouter = require('./api/recipe-items/riRouter');

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
app.use('/api/duplicate', orderRouter);


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

// Admin
app.use('/admin', adminRouter);

app.listen(process.env.APP_PORT || 3000, () => {
    console.log(`Server up and running!\nConnection will be established once any request hits!`);
})