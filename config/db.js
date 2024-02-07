require('dotenv').config();

const mysql = require('mysql');

const pool = mysql.createPool({
    port: process.env.DB_PORT_TEST,
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASS_TEST,
    database: process.env.DB_NAME_TEST,
    connectionLimit: 1,
    connectTimeout  : 60 * 60 * 1000,
    acquireTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
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