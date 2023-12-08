const {createItems} = require('../items/item.controller');
const router = require('express').Router();

router.post('/', createItems);

module.exports = router;