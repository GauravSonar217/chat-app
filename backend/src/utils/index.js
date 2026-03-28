const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/config");
const mongoose = require("mongoose");

/* =========================================================
API ERROR
========================================================= */
class ApiError extends Error {
  constructor({
    statusCode = 500,
    message = "Something went wrong",
    code = "INTERNAL_SERVER_ERROR",
    errors = [],
  }) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.code = code;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/* =========================================================
API RESPONSE
========================================================= */
class ApiResponse {
  constructor({ message = "Success", data = null }) {
    this.success = true;
    this.message = message;
    if (data !== null) this.data = data;
  }
}

/* =========================================================
ASYNC HANDLER
========================================================= */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =========================================================
PASSWORD SERVICE
========================================================= */
const PasswordService = {
  hash: async (password) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  compare: async (plain, hash) => bcrypt.compare(plain, hash),

  validateStrength: (password) => {
    const strong =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strong.test(password)) {
      throw new ApiError({
        statusCode: 400,
        message:
          "Password must contain uppercase, lowercase, number and special character",
        code: "WEAK_PASSWORD",
      });
    }
  },
};

/* =========================================================
TOKEN SERVICE
========================================================= */
const TokenService = {
  generateAccessToken: (user) =>
    jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.jwtSecretKey,
      { expiresIn: "1d" }
    ),

  generateRefreshToken: (user) =>
    jwt.sign({ id: user._id }, config.refreshTokenSecret, {
      expiresIn: "7d",
    }),

  verifyAccessToken: (token) =>
    jwt.verify(token, config.jwtSecretKey),

  verifyRefreshToken: (token) =>
    jwt.verify(token, config.refreshTokenSecret),
};

/* =========================================================
CRYPTO SERVICE
========================================================= */
const CryptoService = {
  generateOTP: (digits = 6) =>
    Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1)).toString(),

  hash: (value) =>
    crypto.createHash("sha256").update(value).digest("hex"),

  randomToken: (size = 32) =>
    crypto.randomBytes(size).toString("hex"),
};

/* =========================================================
COOKIE OPTIONS
========================================================= */
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
};

/* =========================================================
SANITIZE USER
========================================================= */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };

  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpires;
  delete obj.passwordResetVerified;
  delete obj.passwordResetOTP;
  delete obj.passwordResetOTPExpires;
  delete obj.__v;

  return obj;
};

const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

/* =========================================================
🔥 SINGLE EXPORT OBJECT (IMPORTANT)
========================================================= */
module.exports = {
  ApiError,
  ApiResponse,
  asyncHandler,
  PasswordService,
  TokenService,
  CryptoService,
  convertToObjectId,
  cookieOptions,
  sanitizeUser,
};
