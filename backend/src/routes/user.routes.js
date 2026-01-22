const express = require('express');
const { userController } = require('../controller');
const { registerSchema, loginSchema, verifyEmailSchema } = require('../validator/user.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router.post("/auth/register", validate(registerSchema), userController.registerUser);
router.post("/auth/login", validate(loginSchema), userController.loginUser);
router.post("/auth/logout", userController.logoutUser);
router.post("/auth/verify-email", validate(verifyEmailSchema), userController.verifyEmail);

module.exports = router;