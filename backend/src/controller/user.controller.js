
const User = require('../model/user.model');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require("google-auth-library");
const config = require("../config/config");
const client = new OAuth2Client(config.googleClientId);
const axios = require("axios");

const {
	ApiError,
	ApiResponse,
	asyncHandler,
	PasswordService,
	TokenService,
	CryptoService,
	cookieOptions,
	sanitizeUser,
	convertToObjectId
} = require('../utils/index.js');

exports.registerUser = asyncHandler(async (req, res) => {
	const { username, fullName, email, password, phoneNumber } = req.body;

	const existingUser = await User.findOne({ $or: [{ email }, { username }] });
	if (existingUser) {
		throw new ApiError({
			statusCode: 409,
			message: 'User with this email or username already exists.',
			code: 'USER_EXISTS'
		});
	}

	await PasswordService.validateStrength(password);

	const otp = CryptoService.generateOTP(6);
	const otpExpires = new Date(Date.now() + 60 * 1000);
	const hashedOtp = CryptoService.hash(otp);

	const hashedPassword = await PasswordService.hash(password);

	const newUser = new User({
		username,
		fullName,
		email,
		password: hashedPassword,
		phoneNumber,
		authProvider: "local",
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

	const userObj = sanitizeUser(newUser);

	res.status(201).json(new ApiResponse({
		message: 'User registered successfully. Please verify your email.',
		data: userObj
	}));
});

exports.loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		throw new ApiError({
			statusCode: 400,
			message: 'Invalid credentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	if (!user.password) {
		throw new ApiError({
			statusCode: 400,
			message: "Please login with Google",
			code: "GOOGLE_AUTH_ONLY"
		});
	}

	if (user.authProvider === "google") {
		throw new ApiError({
			statusCode: 400,
			message: "Please login with Google",
			code: "GOOGLE_AUTH_ONLY"
		});
	}

	const isMatch = await PasswordService.compare(password, user.password);

	if (!isMatch) {
		throw new ApiError({
			statusCode: 400,
			message: 'Invalid credentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	const accessToken = TokenService.generateAccessToken(user);
	const refreshToken = TokenService.generateRefreshToken(user);
	const hashedRefreshToken = CryptoService.hash(refreshToken);

	user.refreshToken = hashedRefreshToken;
	await user.save();
	const userObj = sanitizeUser(user);

	res.cookie("refreshToken", refreshToken, {
		...cookieOptions,
		maxAge: 7 * 24 * 60 * 60 * 1000
	});

	res.status(200).json(new ApiResponse({
		message: 'User logged in successfully',
		data: {
			accessToken,
			user: userObj
		}
	}));
});

exports.googleLogin = asyncHandler(async (req, res) => {
	const { token } = req.body;

	const googleRes = await axios.get(
		"https://www.googleapis.com/oauth2/v3/userinfo",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	const { email, name } = googleRes.data;

	let user = await User.findOne({ email });

	if (!user) {
		user = await User.create({
			email,
			username: email.split("@")[0],
			fullName: name,
			password: null,
			authProvider: "google",
			emailVerified: true,
		})
	}

	const accessToken = TokenService.generateAccessToken(user);
	const refreshToken = TokenService.generateRefreshToken(user);

	const hashedRefreshToken = CryptoService.hash(refreshToken);
	user.refreshToken = hashedRefreshToken;
	await user.save();

	res.cookie("refreshToken", refreshToken, cookieOptions);

	res.status(200).json(new ApiResponse({
		message: 'User logged in successfully',
		data: {
			accessToken,
			user: sanitizeUser(user),
		},
	}));
})

exports.logoutUser = asyncHandler(async (req, res) => {
	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		return res.status(200).json(new ApiResponse({
			message: "User already logged out"
		}));
	}

	const hashedToken = CryptoService.hash(refreshToken);

	await User.updateOne(
		{ refreshToken: hashedToken },
		{ $unset: { refreshToken: "" } }
	);

	res.clearCookie("refreshToken", cookieOptions);

	res.status(200).json(new ApiResponse({
		message: "User Logged out successfully"
	}));
});

exports.sentOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new ApiError({
			statusCode: 400,
			message: 'User not found with this email',
			code: 'USER_NOT_FOUND'
		});
	}

	const otp = CryptoService.generateOTP(6);
	const otpExpires = new Date(Date.now() + 60 * 1000);
	const hashedOtp = CryptoService.hash(otp);

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

	res.status(200).json(new ApiResponse({
		message: 'Password reset code sent successfully to your email',
	}));
});

exports.verifyEmail = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		throw new ApiError({
			statusCode: 400,
			message: 'Invalid email or OTP.',
			code: 'INVALID_EMAIL_OTP'
		});
	}
	if (user.emailVerified) {
		throw new ApiError({
			statusCode: 400,
			message: 'Email already verified.',
			code: 'EMAIL_ALREADY_VERIFIED'
		});
	}
	if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
		throw new ApiError({
			statusCode: 400,
			message: 'OTP not found',
			code: 'OTP_NOT_FOUND'
		});
	}
	if (user.emailVerificationOTPExpires < new Date()) {
		throw new ApiError({
			statusCode: 410,
			message: 'OTP expired',
			code: 'OTP_EXPIRED'
		});
	}

	const hashedInputOtp = CryptoService.hash(otp);

	if (user.emailVerificationOTP !== hashedInputOtp) {
		throw new ApiError({
			statusCode: 401,
			message: 'Invalid OTP',
			code: 'INVALID_OTP'
		});
	}

	user.emailVerified = true;
	user.emailVerificationOTP = undefined;
	user.emailVerificationOTPExpires = undefined;
	await user.save();
	res.status(200).json(new ApiResponse({
		message: 'Email verified successfully, please login to continue.'
	}));
});

exports.verifyOtp = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		throw new ApiError({
			statusCode: 400,
			message: 'Invalid email or OTP.',
			code: 'INVALID_EMAIL_OTP'
		});
	}
	if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
		throw new ApiError({
			statusCode: 400,
			message: 'OTP not found',
			code: 'OTP_NOT_FOUND'
		});
	}
	if (user.passwordResetOTPExpires < new Date()) {
		throw new ApiError({
			statusCode: 410,
			message: 'OTP expired',
			code: 'OTP_EXPIRED'
		});
	}

	const hashedInputOtp = CryptoService.hash(otp);

	if (user.passwordResetOTP !== hashedInputOtp) {
		throw new ApiError({
			statusCode: 400,
			message: 'Invalid OTP',
			code: 'INVALID_OTP'
		});
	}

	user.passwordResetVerified = true;
	user.passwordResetVerifiedAt = new Date();

	user.passwordResetOTP = undefined;
	user.passwordResetOTPExpires = undefined;
	await user.save();

	res.status(200).json(new ApiResponse({
		message: 'OTP verified successfully, please reset your password.'
	}));
});

exports.changePassword = asyncHandler(async (req, res) => {
	const { email, newPassword, confirmPassword } = req.body;

	if (!newPassword || !confirmPassword) {
		throw new ApiError({
			statusCode: 400,
			message: 'All fields are required',
			code: 'FIELDS_REQUIRED'
		});
	}

	if (newPassword !== confirmPassword) {
		throw new ApiError({
			statusCode: 400,
			message: 'Passwords do not match',
			code: 'PASSWORDS_MISMATCH'
		});
	}

	await PasswordService.validateStrength(newPassword);

	const user = await User.findOne({ email });

	if (!user) {
		throw new ApiError({
			statusCode: 404,
			message: 'User not found.',
			code: 'USER_NOT_FOUND'
		});
	}

	if (!user.passwordResetVerified) {
		throw new ApiError({
			statusCode: 400,
			message: 'OTP verification required before changing password',
			code: 'OTP_VERIFICATION_REQUIRED'
		});
	}

	const RESET_WINDOW = 5 * 60 * 1000;

	if (user.passwordResetVerifiedAt && Date.now() - user.passwordResetVerifiedAt.getTime() > RESET_WINDOW) {
		throw new ApiError({
			statusCode: 400,
			message: 'Password reset link has expired, please request OTP again',
			code: 'RESET_LINK_EXPIRED'
		});
	}

	const isSamePassword = await PasswordService.compare(newPassword, user.password);

	if (isSamePassword) {
		throw new ApiError({
			statusCode: 400,
			message: 'New password cannot be same as old password',
			code: 'PASSWORD_SAME'
		});
	}

	user.password = await PasswordService.hash(newPassword);
	user.passwordResetVerified = false;
	user.passwordResetVerifiedAt = undefined;

	await user.save();

	res.status(200).json(new ApiResponse({
		message: 'Password changed successfully, please login to continue.'
	}));
});

exports.refreshAccessToken = asyncHandler(async (req, res) => {

	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		throw new ApiError({
			statusCode: 401,
			message: 'Refresh token missing',
			code: 'REFRESH_TOKEN_MISSING'
		});
	}

	let decoded;

	try {
		decoded = TokenService.verifyRefreshToken(refreshToken);
	} catch (error) {
		throw new ApiError({
			statusCode: 401,
			message: 'Invalid refresh token',
			code: 'INVALID_REFRESH_TOKEN'
		});
	}

	const user = await User.findById(decoded.id);

	if (!user) {
		throw new ApiError({ statusCode: 401, message: "User not found" });
	}

	const hashedToken = CryptoService.hash(refreshToken);

	if (user.refreshToken !== hashedToken) {
		throw new ApiError({
			statusCode: 401,
			message: 'Refresh token does not match',
			code: 'REFRESH_TOKEN_MISMATCH'
		});
	}

	const newAccessToken = TokenService.generateAccessToken(user);
	const newRefreshToken = TokenService.generateRefreshToken(user);

	const newHashedRefreshToken = CryptoService.hash(newRefreshToken);

	user.refreshToken = newHashedRefreshToken;
	await user.save();

	res.cookie("refreshToken", newRefreshToken, cookieOptions);

	res.status(200).json(new ApiResponse({
		message: 'Access token refreshed successfully',
		data: {
			accessToken: newAccessToken
		}
	}));
})

exports.getAllUsers = asyncHandler(async (req, res) => {

	const userIdObj = convertToObjectId(req.user.id);

	let { search = "", page = 1, limit = 10 } = req.query;

	page = Number(page);
	limit = Number(limit);

	const skip = (page - 1) * limit;

	const pipeline = [
		{
			$match: {
				_id: { $ne: userIdObj },
				...(search && { fullName: { $regex: search, $options: "i" } })
			}
		},
		{
			$project: {
				username: 1,
				email: 1,
				avatar: 1,
				fullName: 1,
				phoneNumber: 1,
				role: 1,
				createdAt: 1,
				updatedAt: 1
			}
		},
		{
			$facet: {
				users: [
					{ $skip: skip },
					{ $limit: limit }
				],
				totalCount: [
					{ $count: "count" }
				]
			}
		}

	];

	const result = await User.aggregate(pipeline);

	const users = result[0].users;
	const total = result[0].totalCount[0]?.count || 0;

	res.status(200).json(new ApiResponse({
		message: "Users fetched successfully",
		data: {
			users,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit)
			}
		}
	})
	);
});

exports.getProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user.id);

	res.status(200).json(new ApiResponse({
		message: "Profile fetched",
		data: sanitizeUser(user)
	}));
});

// PUT /user/profile
exports.updateProfile = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const { fullName, phoneNumber } = req.body;

	const updateData = {
		...(fullName && { fullName }),
		...(phoneNumber && { phoneNumber }),
	};

	if (req.file) {
		updateData.avatar = req.file.path;
	}

	const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

	res.status(200).json(new ApiResponse({
		message: "Profile updated successfully",
		data: sanitizeUser(updatedUser)
	}));
});