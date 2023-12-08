const {create,getEmployees,getEmployeeById,updateEmplyee,deleteEmployee} = require('./user.service');

module.exports = {
    createEmployee: (req, res) => {
        const body = req.body;
        create(body, (err, results) => {
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: 'Database connection error!'
                })
            }
            return res.status(200).json({
                success: 1,
                data: results
            });
        });
    },
    getEmployee: (req, res) => {
        getEmployees((err, results) => {
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: 'Record Not Found!'
                })
            }
            return res.status(200).json({
                success: 1,
                data: results
            });
        });
    },
    getEmployeeById: (req, res) => {
        const id = req.params.id;
        getEmployeeById(id, (err, results) => {
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: 'Record Not Found!'
                })
            }
            return res.status(200).json({
                success: 1,
                data: results
            });
        });
    },
    updateEmployee: (req, res) => {
        const body = req.body;
        updateEmployee(body, (err, results) => {
            if(err){
                console.log(err);
                return res.status(404).json({
                    success: 0,
                    message: 'Employee Not Exist!'
                })
            }
            if (!results) {
                return res.status(500).json({
                    success: 0,
                    message: 'Record Update Failed!'
                })
            }
            return res.status(200).json({
                success: 1,
                data: results
            });
        });
    },
    deleteEmployee: (req, res) => {
        const id = req.params.id;
        deleteEmployee(id, (err, results) => {
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: 'Record Not Found!'
                })
            }
            return res.status(200).json({
                success: 1,
                message: 'Record successfully deleted!'
            });
        });
    },
};