
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
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const token = jwt.sign(
			{ id: user._id, email: user.email, role: user.role },
			config.jwtSecretKey,
			{ expiresIn: '1h' }
		);

		const userObj = user.toObject();
		delete userObj.password;

		res.status(200).json({
			success: true,
			token,
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
		res.status(200).json({
			success: true,
			message: 'User logged out successfully'
		});

	} catch (error) {
		console.error('Logout error:', error);
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

exports.resendOtp = async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const otpExpires = new Date(Date.now() + 60 * 1000);
	const hashedOtp = crypto
	.createHash('sha256')
	.update(otp)
	.digest('hex');
	
	user.emailVerificationOTP = hashedOtp;
	user.emailVerificationOTPExpires = otpExpires;
	
	await user.save();

	await sendEmail({
		to: email,
		subject: "Your new OTP",
		text: `Your OTP is ${otp}`,
		html: `<p>Your verification code is: <b>${otp}</b></p>`
	});

	res.status(200).json({ success: true, message: "OTP resent successfully" });
};
