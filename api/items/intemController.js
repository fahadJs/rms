const connection = require("../../config/database");

const getAll = (req, res) => {
    let sql = 'SELECT * FROM menuitems';
    let query = connection.query(sql, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json('Error while Fetching items!');
        }else{
            res.status(200).json(result);
        }
    });
}

const create = (req, res) => {
    let data = { name: req.body.name, description: req.body.description, price: req.body.price, categoryId: req.body.categoryId};
    let sql = 'INSERT INTO menuitems SET ?';
    let query = connection.query(sql, data, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json('Error while Adding items!');
        }else{
            res.status(200).json('New Record Inserted Successfully!');
        }
    });
}

module.exports = {
    getAll,
    create
}