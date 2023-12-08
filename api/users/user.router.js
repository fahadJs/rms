const {createEmployee,getEmployee,getEmployeeById,updateEmployee,deleteEmployee} = require('./user.controller');
const router = require('express').Router();

router.post("/", createEmployee);
router.get("/", getEmployee);
router.get("/:id", getEmployeeById);
router.put("/", updateEmployee);
router.delete("/", deleteEmployee);
module.exports = router;