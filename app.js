require('dotenv').config();
const express = require('express');
const app = express();
const userRouter = require('./api/users/user.router');
const itemRouter = require('./api/items/item.router')

app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/items', itemRouter);

app.listen(process.env.APP_PORT, () => {
    console.log('Server up and running!');
})