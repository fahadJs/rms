require('dotenv').config();

const mysql = require('mysql');

const pool = mysql.createPool({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) {
                console.error(`Connection Failed! Error: ${err}`);
                reject(error);
                return;
            } else {
                console.info('Successful Pool Connection with MySQL server.');
                connection.query(sql, values, (queryErr, results, fields) => {
                    connection.release();
                    console.info(`Connection released back to Pool!`);

                    if (queryErr) {
                        console.error(`Error while executing query! Error: ${queryErr}`);
                        reject(queryErr);
                        console.error(`Connection Rejected!`);
                    } else {
                        resolve(results);
                        console.info(`Connection Resolved!`);
                    }
                });
            }
        });
    });
}

module.exports = {
    query
};