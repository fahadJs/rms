require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./config/database');
const itemRouter = require('./api/items/itemRouter');
const floorsRouter = require('./api/floors/floorRouter');
const caiRouter = require('./api/category-and-items/caiRouter');
const bosyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bosyParser.json());
// app.use('/api/users', userRouter);
app.use('/api/items', itemRouter);
app.use('/api/floors', floorsRouter);
app.use('/api/cai', caiRouter);

app.listen(process.env.APP_PORT || 3000, () => {
    console.log(`Server up and running!\nConnection will be established once any request hits!`);
})