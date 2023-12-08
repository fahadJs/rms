const pool = require('../../config/database');

module.exports = {
    createItems: (data, callBack) => {
        pool.query('insert into menuitems(Name, Description, Price, CategoryId) values(?,?,?,?)',
            [
                data.name,
                data.description,
                data.price,
                data.categoryId
            ],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getAllItems 
};