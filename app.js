require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./config/database');
const itemRouter = require('./api/items/itemRouter')
const bosyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bosyParser.json());
// app.use('/api/users', userRouter);
app.use('/api/items', itemRouter);

app.listen(process.env.APP_PORT || 3000, () => {
    console.log('Server up and running!');
})