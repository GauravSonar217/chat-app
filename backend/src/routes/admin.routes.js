const express = require('express');
const { adminController } = require('../controller');

const router = express.Router();

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);

module.exports = router;