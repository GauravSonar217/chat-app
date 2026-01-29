
const User = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.registerUser = async (req, res) => {
	try {
		const { username, fullName, email, password, phoneNumber } = req.body;

		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			return res.status(409).json({ message: 'User with this email or username already exists.' });
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 60 * 1000);
		const hashedOtp = crypto
			.createHash('sha256')
			.update(otp)
			.digest('hex');

		const newUser = new User({
			username,
			fullName,
			email,
			password,
			phoneNumber,
			emailVerificationOTP: hashedOtp,
			emailVerificationOTPExpires: otpExpires,
			emailVerified: false,
		});

		await newUser.save();

		try {
			await sendEmail({
				to: email,
				subject: 'Verify your email',
				text: `Your verification code is: ${otp}`,
				html: `<p>Your verification code is: <b>${otp}</b></p>`
			});
		} catch (err) {
			console.error("Email failed:", err.message);
		}

		const userObj = newUser.toObject();
		delete userObj.password;
		delete userObj.emailVerificationOTP;
		delete userObj.emailVerificationOTPExpires;
		delete userObj.__v;

		res.status(201).json({
			success: true,
			message: 'User registered successfully. Please verify your email.',
			user: userObj,
		});

	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
};

exports.loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const token = jwt.sign(
			{ id: user._id, email: user.email, role: user.role },
			config.jwtSecretKey,
			{ expiresIn: '1h' }
		);

		const accessToken = jwt.sign(
			{ id: user._id, role: user.role },
			config.jwtSecretKey,
			{ expiresIn: "15m" }
		);

		const refreshToken = jwt.sign(
			{ id: user._id },
			config.refreshTokenSecret,
			{ expiresIn: "7d" }
		);

		const hashedRefreshToken = crypto
			.createHash("sha256")
			.update(refreshToken)
			.digest("hex");

		user.refreshToken = hashedRefreshToken;
		await user.save();
		const userObj = user.toObject();
		delete userObj.password;

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000
		});

		res.status(200).json({
			success: true,
			accessToken,
			message: 'User logged in successfully',
			user: userObj,
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ message: 'Server error. Please try again later' });
	}
};

exports.logoutUser = async (req, res) => {
	try {

		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.sendStatus(204);
		}

		const hashedToken = crypto
			.createHash("sha256")
			.update(refreshToken)
			.digest("hex");

		await User.updateOne(
			{ refreshToken: hashedToken },
			{ $unset: { refreshToken: "" } }
		);

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: true,
			sameSite: "strict"
		});

		res.status(200).json({
			success: true,
			message: "User Logged out successfully"
		});

	} catch (error) {
		console.error('Logout error:', error); 
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
};

exports.sentOTP = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'User not found with this email' });
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 60 * 1000);
		const hashedOtp = crypto
			.createHash('sha256')
			.update(otp)
			.digest('hex');

		user.passwordResetOTP = hashedOtp;
		user.passwordResetOTPExpires = otpExpires;
		await user.save();

		try {
			await sendEmail({
				to: email,
				subject: 'Forget Password',
				text: `Password reset code is: ${otp}`,
				html: `<p>Your password reset code is: <b>${otp}</b></p>`
			});
		} catch (err) {
			console.error("Email failed:", err.message);
		}

		res.status(200).json({
			success: true,
			message: 'Password reset code send successfully to your email',
		});

	} catch (error) {
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
};

exports.verifyEmail = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'Invalid email or OTP.' });
		}
		if (user.emailVerified) {
			return res.status(400).json({ message: 'Email already verified.' });
		}
		if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
			return res.status(400).json({ message: "OTP not found" });
		}
		if (user.emailVerificationOTPExpires < new Date()) {
			return res.status(410).json({ message: "OTP expired" });
		}

		const hashedInputOtp = crypto
			.createHash('sha256')
			.update(otp)
			.digest('hex');

		if (user.emailVerificationOTP !== hashedInputOtp) {
			return res.status(401).json({ message: "Invalid OTP" });
		}

		user.emailVerified = true;
		user.emailVerificationOTP = undefined;
		user.emailVerificationOTPExpires = undefined;
		await user.save();
		return res.status(200).json({
			success: true,
			message: 'Email verified successfully, please login to continue.'
		});

	} catch (error) {
		console.error('Email verification error:', error);
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
};

exports.verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'Invalid email or OTP.' });
		}
		if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
			return res.status(400).json({ message: "OTP not found" });
		}
		if (user.passwordResetOTPExpires < new Date()) {
			return res.status(410).json({ message: "OTP expired" });
		}

		const hashedInputOtp = crypto
			.createHash('sha256')
			.update(otp)
			.digest('hex');

		if (user.passwordResetOTP !== hashedInputOtp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		user.passwordResetVerified = true;
		user.passwordResetVerifiedAt = new Date();

		user.passwordResetOTP = undefined;
		user.passwordResetOTPExpires = undefined;
		await user.save();

		return res.status(200).json({
			success: true,
			message: 'OTP verified successfully, please reset your password.'
		});

	} catch (error) {
		console.error('OTP verification error:', error);
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const { email, newPassword, confirmPassword } = req.body;

		if (!newPassword || !confirmPassword) {
			return res.status(400).json({ message: "All fields are required" });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match" });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		if (!user.passwordResetVerified) {
			return res.status(400).json({
				message: "OTP verification required before changing password"
			});
		}

		const RESET_WINDOW = 5 * 60 * 1000;


		if (user.passwordResetVerifiedAt && Date.now() - user.passwordResetVerifiedAt.getTime() > RESET_WINDOW) {
			return res.status(400).json({ message: "Password reset link has expired, please request OTP again" });
		}

		const isSamePassword = await bcrypt.compare(newPassword, user.password);

		if (isSamePassword) {
			return res.status(400).json({ message: "New password cannot be same as old password" });
		}

		user.password = newPassword;
		user.passwordResetVerified = false;
		user.passwordResetVerifiedAt = undefined;

		await user.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully, please login to continue."
		})

	} catch (error) {
		console.error('Password change error:', error);
		res.status(500).json({ message: 'Server error. Please try again later.' });
	}
}