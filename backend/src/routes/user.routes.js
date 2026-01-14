const express = require('express');
const { userController } = require('../controller');
const { registerSchema, loginSchema } = require('../validator/user.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router.post("/register", validate(registerSchema), userController.registerUser);
router.post("/login", validate(loginSchema), userController.loginUser);


module.exports = router;