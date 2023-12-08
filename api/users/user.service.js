const pool = require('../../config/database');

module.exports = {
    create: (data, callBack) => {
        pool.query('insert into employees(Name, contactInfo, Role, Schedule) values(?,?,?,?)',
            [
                data.name,
                data.contactInfo,
                data.role,
                data.schedule
            ],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    getEmployees: callBack => {
        pool.query(
            'SELECT * FROM employees',
            [],
            (error, results, fields) => {
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    getEmployeeById: (id, callBack) => {
        pool.query('SELECT * FROM employees WHERE EmployeeID = ?',
            [
                id
            ],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    },
    updateEmplyee: (data, callBack) => {
        pool.query('UPDATE employees SET Name = ?, ContactInfo = ?, Role = ?, Schedule = ? where EmployeeID = ?',
            [
                data.name,
                data.contactInfo,
                data.role,
                data.schedule,
                data.id
            ],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    },
    deleteEmployee: (id, callBack) => {
        pool.query('DELETE FROM employees WHERE EmployeeID = ?',
            [
                id
            ],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    }
};