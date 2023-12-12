require('dotenv').config();

const mysql = require('mysql');

const connection = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.log(`Connection Failed! Error: ${err}`);
    } else {
        console.log('Connected to the MySQL server.');
    }
});

module.exports = connection;