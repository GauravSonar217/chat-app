const express = require('express');
const { userController } = require('../controller');
const { registerSchema, loginSchema, verifyOTPSchema, sendOtpSchema } = require('../validator/user.validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth.middleware').protect;

const router = express.Router();

// auth routes
router.post("/auth/register", validate(registerSchema), userController.registerUser);
router.post("/auth/login", validate(loginSchema), userController.loginUser);
router.post("/auth/logout", userController.logoutUser);
router.post("/auth/verify-email", validate(verifyOTPSchema), userController.verifyEmail);
router.post("/auth/send-otp", validate(sendOtpSchema), userController.sentOTP);
router.post("/auth/verify-otp", validate(verifyOTPSchema), userController.verifyOtp);
router.post("/auth/change-password", userController.changePassword);
router.post("/auth/google", userController.googleLogin);

// user routes
router.get("/users", auth, userController.getAllUsers);

module.exports = router;