require('dotenv').config();

const mysql = require('mysql');

const pool = mysql.createPool({
    port: process.env.TASK_DB_PORT,
    host: process.env.TASK_DB_HOST,
    user: process.env.TASK_DB_USER,
    password: process.env.TASK_DB_PASS,
    database: process.env.TASK_DB_NAME,
    connectionLimit: 1
});

const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) {
                console.error(`Connection Failed! Error: ${error}`);
                reject(error);
                return;
            } else {
                console.info('Successful Pool Connection with MySQL server.');
                connection.query(sql, values, (queryErr, results, fields) => {
                    console.info(`Connection Released back to pool!`);
                    connection.release();
                    if (queryErr) {
                        console.error(`Error while executing query! Error: ${queryErr}`);
                        console.error(`Connection Rejected!`);
                        reject(queryErr);
                    } else {
                        console.info(`Connection Resolved!`);
                        resolve(results);
                    }
                });
            }
        });
    });
}


module.exports = {
    query
};